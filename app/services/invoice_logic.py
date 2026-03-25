from datetime import datetime
from app.db import invoices_collection, inventory_collection
import re


# =========================================================
# 0) HELPERS
# =========================================================
def safe_float(x: str):
    """
    Handles values like:
    1,271.190
    ₹5.93
    ` 35,414.00
    """
    if x is None:
        return None

    x = str(x)
    x = x.replace(",", "")
    x = x.replace("₹", "")
    x = x.replace("`", "")
    x = x.replace("Rs.", "")
    x = x.replace("INR", "")
    x = x.strip()

    # remove trailing weird stuff
    x = re.sub(r"[^0-9.\-]", "", x)

    if not x:
        return None

    try:
        return float(x)
    except:
        return None


def safe_int(x: str):
    f = safe_float(x)
    if f is None:
        return None
    return int(round(f))


# =========================================================
# 1) TABLE TYPE DETECTION
# =========================================================
def detect_table_type(table_text: str) -> str:
    t = table_text.lower()

    # FIX: Amazon invoices sometimes miss "igst" in header
    if "sl. no" in t and "tax type" in t and "total amount" in t:
        return "AMAZON_IGST"

    if "cgst" in t and "sgst" in t:
        return "CGST_SGST"

    if "igst" in t and "description of goods" in t:
        return "GENERIC_IGST"

    return "UNKNOWN"


# =========================================================
# 2) TABLE EXTRACTION (MULTI TABLE FIX)
# =========================================================
def extract_table_section(full_text: str) -> str:
    """
    Extracts ALL invoice tables from a single page.

    FIX:
    - Amazon PDF contains 2 invoices in same PDF:
      1) COD fee table
      2) Actual product table (RETAILEZ)
    - Earlier code only extracted first table.
    - Now we scan page and collect multiple tables.
    """

    lines = [line.rstrip() for line in full_text.split("\n") if line.strip()]
    lowered = [l.lower().strip() for l in lines]

    tables = []

    i = 0
    while i < len(lines):
        window = " ".join(lowered[i:i + 12])

        is_amazon_header = (
            "sl." in window
            and "description" in window
            and "unit price" in window
            and "tax type" in window
            and "total amount" in window
        )

        is_cgst_header = (
            "description of goods" in window
            and ("hsn" in window or "hsn/sac" in window)
            and ("cgst" in window or "sgst" in window)
        )

        is_generic_igst_header = (
            "description of goods" in window
            and ("hsn/sac" in window or "hsn" in window)
            and "quantity" in window
            and "rate" in window
        )

        if not (is_amazon_header or is_cgst_header or is_generic_igst_header):
            i += 1
            continue

        start_index = i

        # Find end
        end_index = len(lines)
        for j in range(start_index + 1, len(lines)):
            l = lowered[j]

            if "amount in words" in l:
                end_index = j
                break
            if "bank details" in l:
                end_index = j
                break
            if "terms & conditions" in l:
                end_index = j
                break
            if "receiver's signature" in l:
                end_index = j
                break
            if l.startswith("less :"):
                end_index = j
                break
            if l == "total" or "grand total" in l:
                end_index = j + 1
                break

        table_lines = lines[start_index:end_index]

        # Trim junk before first item number, but keep header
        first_item = None
        for k in range(len(table_lines)):
            if re.match(r"^\s*\d+\.\s+", table_lines[k]):  # CGST style
                first_item = k
                break
            if re.match(r"^\s*\d+\s*$", table_lines[k]):  # Amazon / IGST style
                first_item = k
                break

        if first_item is not None:
            header_part = table_lines[:first_item]
            row_part = table_lines[first_item:]
            table_lines = header_part + row_part

        tables.append("\n".join(table_lines))

        # Jump forward so we can detect another table later
        i = end_index
        continue

    return "\n\n---TABLE BREAK---\n\n".join(tables)


# =========================================================
# 3) METADATA EXTRACTION
# =========================================================
def extract_invoice_metadata(full_text: str) -> dict:
    text = full_text.replace("\n", " ")

    def find(pattern):
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None

    invoice_number = (
        find(r"Invoice Number\s*[:\-]?\s*([A-Z0-9\-\/]+)")
        or find(r"Invoice No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)")
        or find(r"Bill No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)")
    )

    # supports: 09-07-2024, 06.02.2026, 10-Jul-24
    invoice_date = (
        find(r"Invoice Date\s*[:\-]?\s*([0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})")
        or find(r"Date of Invoice\s*[:\-]?\s*([0-9]{2}[.\-/][0-9]{2}[.\-/][0-9]{4})")
        or find(r"Ack Date\s*[:\-]?\s*([0-9]{2}\-[A-Za-z]{3}\-[0-9]{2})")
        or find(r"dt\.\s*([0-9]{2}\-[A-Za-z]{3}\-[0-9]{2})")
    )

    order_number = (
        find(r"Order Number\s*[:\-]?\s*([0-9\-]+)")
        or find(r"Order No\.?\s*[:\-]?\s*([0-9\-]+)")
    )

    gstins = re.findall(
        r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b",
        text
    )

    seller_gstin = gstins[0] if len(gstins) > 0 else None
    buyer_gstin = gstins[1] if len(gstins) > 1 else None

    return {
        "invoice_number": invoice_number,
        "invoice_date": invoice_date,
        "order_number": order_number,
        "seller_gstin": seller_gstin,
        "buyer_gstin": buyer_gstin
    }


# =========================================================
# 4) PARSERS
# =========================================================
def parse_items_cgst_sgst(table_text: str) -> list:
    """
    PDF2 style.
    Rows are like:
    1. DESC
    HSN
    5.00 Nos
    55.000 9.00 %
    24.75 9.00 %
    24.75
    324.500
    """

    if not table_text.strip():
        return []

    lines = [l.strip() for l in table_text.split("\n") if l.strip()]

    items = []
    i = 0

    while i < len(lines):
        line = lines[i]

        m = re.match(r"^(\d+)\.\s*(.+)$", line)
        if not m:
            i += 1
            continue

        sl_no = int(m.group(1))
        description = m.group(2).strip()
        i += 1

        # HSN line
        hsn = None
        if i < len(lines):
            if re.match(r"^[0-9]{4,10}$", lines[i].replace(" ", "")):
                hsn = lines[i].replace(" ", "")
                i += 1

        # Qty + Unit
        qty = None
        unit = None
        if i < len(lines):
            qm = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)", lines[i])
            if qm:
                qty = safe_int(qm.group(1))
                unit = qm.group(2)
                i += 1

        unit_price = None
        cgst_rate = None
        cgst_amount = None
        sgst_rate = None
        sgst_amount = None
        total_amount = None

        # merged special case (your item 11)
        if i < len(lines) and lines[i].count("%") >= 2:
            merged = lines[i]
            merged_pattern = (
                r"([0-9,]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*%\s+"
                r"([0-9,]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*%\s+"
                r"([0-9,]+(?:\.[0-9]+)?)"
            )
            mm = re.search(merged_pattern, merged)

            if mm:
                unit_price = safe_float(mm.group(1))
                cgst_rate = safe_float(mm.group(2))
                cgst_amount = safe_float(mm.group(3))
                sgst_rate = safe_float(mm.group(4))
                sgst_amount = safe_float(mm.group(5))
                i += 1
            else:
                i += 1
                continue
        else:
            # unit price + cgst rate
            if i < len(lines):
                pm = re.search(r"([0-9,]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*%", lines[i])
                if pm:
                    unit_price = safe_float(pm.group(1))
                    cgst_rate = safe_float(pm.group(2))
                    i += 1
                else:
                    unit_price = safe_float(lines[i])
                    i += 1

            # cgst amount + sgst rate
            if i < len(lines):
                am = re.search(r"([0-9,]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*%", lines[i])
                if am:
                    cgst_amount = safe_float(am.group(1))
                    sgst_rate = safe_float(am.group(2))
                    i += 1
                else:
                    cgst_amount = safe_float(lines[i])
                    i += 1

            # sgst amount
            if i < len(lines):
                sgst_amount = safe_float(lines[i])
                i += 1

        # total amount
        if i < len(lines):
            total_amount = safe_float(lines[i])
            i += 1

        if qty is None or unit_price is None or total_amount is None:
            continue

        net_amount = round(qty * unit_price, 2)

        items.append({
            "sl_no": sl_no,
            "description": description,
            "hsn": hsn,
            "qty": qty,
            "unit": unit,
            "unit_price": unit_price,
            "net_amount": net_amount,
            "tax_type": "CGST_SGST",
            "cgst_rate": cgst_rate,
            "cgst_amount": cgst_amount,
            "sgst_rate": sgst_rate,
            "sgst_amount": sgst_amount,
            "total_amount": total_amount
        })

    return items


def parse_items_generic_igst(table_text: str) -> list:
    """
    PDF3 style:

    1
    Tele 20" Normal (Hafele)
    3,745.82
    SET
    288.14
    13.00 SET
    18 %
    83024110
    """

    if not table_text.strip():
        return []

    lines = [l.strip() for l in table_text.split("\n") if l.strip()]

    header_keywords = [
        "description of goods", "disc", "rate", "quantity", "gst", "hsn/sac",
        "sl", "no."
    ]

    cleaned = []
    for l in lines:
        if any(h in l.lower() for h in header_keywords):
            continue
        cleaned.append(l)

    items = []
    i = 0

    while i < len(cleaned):
        if not re.match(r"^\d+$", cleaned[i]):
            i += 1
            continue

        sl_no = int(cleaned[i])
        i += 1

        if i >= len(cleaned):
            break
        description = cleaned[i]
        i += 1

        if i >= len(cleaned):
            break
        total_amount = safe_float(cleaned[i])
        i += 1

        if i >= len(cleaned):
            break
        unit = cleaned[i].strip()
        i += 1

        if i >= len(cleaned):
            break
        unit_price = safe_float(cleaned[i])
        i += 1

        qty = None
        if i < len(cleaned):
            qm = re.search(r"([0-9,]+(?:\.[0-9]+)?)", cleaned[i])
            if qm:
                qty = safe_int(qm.group(1))
            i += 1

        igst_rate = None
        if i < len(cleaned):
            rm = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*%", cleaned[i])
            if rm:
                igst_rate = safe_float(rm.group(1))
            i += 1

        hsn = None
        if i < len(cleaned):
            if re.match(r"^[0-9]{4,10}$", cleaned[i].replace(" ", "")):
                hsn = cleaned[i].replace(" ", "")
            i += 1

        if qty is None or unit_price is None or total_amount is None:
            continue

        net_amount = round(qty * unit_price, 2)

        items.append({
            "sl_no": sl_no,
            "description": description,
            "hsn": hsn,
            "qty": qty,
            "unit": unit,
            "unit_price": unit_price,
            "net_amount": net_amount,
            "tax_type": "IGST",
            "igst_rate": igst_rate,
            "total_amount": total_amount
        })

    return items


def parse_items_amazon_igst(table_text: str) -> list:
    """
    Amazon has 2 possible formats:

    A) COD fee vertical table
    B) Product invoice format:
       HSN:94043090
       ₹244.07 1 ₹244.07 18% IGST ₹43.93 ₹288.00
    """

    if not table_text.strip():
        return []

    lines = [l.strip() for l in table_text.split("\n") if l.strip()]

    items = []

    # ---------- CASE B (PRODUCT ROWS) ----------
    for idx in range(len(lines)):
        if "hsn:" in lines[idx].lower():
            hsn = re.sub(r"[^0-9]", "", lines[idx])

            if idx + 1 < len(lines):
                row = lines[idx + 1]

                m = re.search(
                    r"₹?\s*([0-9,]+(?:\.[0-9]+)?)\s+"
                    r"([0-9]+)\s+"
                    r"₹?\s*([0-9,]+(?:\.[0-9]+)?)\s+"
                    r"([0-9]+(?:\.[0-9]+)?)%\s+"
                    r"(IGST|CGST|SGST)\s+"
                    r"₹?\s*([0-9,]+(?:\.[0-9]+)?)\s+"
                    r"₹?\s*([0-9,]+(?:\.[0-9]+)?)",
                    row,
                    re.IGNORECASE
                )

                if m:
                    unit_price = safe_float(m.group(1))
                    qty = safe_int(m.group(2))
                    net_amount = safe_float(m.group(3))
                    tax_rate = safe_float(m.group(4))
                    tax_type = m.group(5).upper()
                    tax_amount = safe_float(m.group(6))
                    total_amount = safe_float(m.group(7))

                    # description is usually above HSN line
                    desc_lines = []
                    for back in range(1, 6):
                        if idx - back < 0:
                            break
                        prev = lines[idx - back].strip()

                        if prev.lower().startswith("sl"):
                            break
                        if prev.lower().startswith("total"):
                            break
                        if "invoice" in prev.lower():
                            break
                        if "authorized signatory" in prev.lower():
                            break

                        desc_lines.append(prev)

                    desc_lines.reverse()
                    description = " ".join(desc_lines).strip()

                    items.append({
                        "sl_no": len(items) + 1,
                        "description": description,
                        "hsn": hsn,
                        "qty": qty,
                        "unit": None,
                        "unit_price": unit_price,
                        "net_amount": net_amount,
                        "tax_type": tax_type,
                        "igst_rate": tax_rate if tax_type == "IGST" else None,
                        "igst_amount": tax_amount if tax_type == "IGST" else None,
                        "total_amount": total_amount
                    })

    # If we found product items, return them immediately
    if items:
        return items

    # ---------- CASE A (COD FEE vertical) ----------
    header_keywords = [
        "sl.", "description", "unit price", "qty", "net amount",
        "tax rate", "tax type", "tax amount", "total amount"
    ]

    cleaned = []
    for l in lines:
        if any(h in l.lower() for h in header_keywords):
            continue
        cleaned.append(l)

    i = 0
    while i < len(cleaned):
        if not re.match(r"^\d+$", cleaned[i]):
            i += 1
            continue

        sl_no = int(cleaned[i])
        i += 1

        if i >= len(cleaned): break
        description = cleaned[i]
        i += 1

        if i >= len(cleaned): break
        unit_price = safe_float(cleaned[i])
        i += 1

        net_amount = safe_float(cleaned[i]) if i < len(cleaned) else None
        i += 1

        tax_rate = None
        if i < len(cleaned):
            rm = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*%", cleaned[i])
            if rm:
                tax_rate = safe_float(rm.group(1))
            i += 1

        tax_type = cleaned[i] if i < len(cleaned) else None
        i += 1

        tax_amount = safe_float(cleaned[i]) if i < len(cleaned) else None
        i += 1

        total_amount = safe_float(cleaned[i]) if i < len(cleaned) else None
        i += 1

        if unit_price is None or total_amount is None:
            continue

        items.append({
            "sl_no": sl_no,
            "description": description,
            "hsn": None,
            "qty": None,
            "unit": None,
            "unit_price": unit_price,
            "net_amount": net_amount,
            "tax_type": "IGST",
            "igst_rate": tax_rate,
            "igst_amount": tax_amount,
            "total_amount": total_amount
        })

    return items


def parse_items_from_table(table_text: str, table_type: str) -> list:
    if table_type == "CGST_SGST":
        return parse_items_cgst_sgst(table_text)
    if table_type == "GENERIC_IGST":
        return parse_items_generic_igst(table_text)
    if table_type == "AMAZON_IGST":
        return parse_items_amazon_igst(table_text)
    return []


# =========================================================
# 5) FILTER OUT FEES/SERVICES
# =========================================================
def is_non_product_item(description: str) -> bool:
    desc = (description or "").lower()

    blacklist = [
        "delivery",
        "shipping",
        "fee",
        "cod",
        "cash on delivery",
        "handling",
        "packing",
        "packaging",
        "discount",
        "cashback",
        "coupon",
        "offer",
        "promotion",
        "service"
    ]

    return any(word in desc for word in blacklist)


# =========================================================
# 6) INVENTORY UPDATE
# =========================================================
def make_product_key(seller_gstin: str, description: str) -> str:
    seller_gstin = (seller_gstin or "UNKNOWN").strip().upper()
    description = (description or "").strip().lower()
    return f"{seller_gstin}|{description}"


def update_inventory(metadata: dict, items: list):
    LOW_STOCK_THRESHOLD_DEFAULT = 5
    seller_gstin = metadata.get("seller_gstin")
    invoice_number = metadata.get("invoice_number")
    invoice_date = metadata.get("invoice_date")

    for item in items:
        description = item.get("description", "").strip()
        qty = item.get("qty", 0) or 0

        if is_non_product_item(description):
            continue

        product_key = make_product_key(seller_gstin, description)

        inventory_collection.update_one(
            {"product_key": product_key},
            {
                "$set": {
                    "product_key": product_key,
                    "description": description,
                    "seller_gstin": seller_gstin,
                    "last_unit_price": item.get("unit_price"),
                    "last_invoice_number": invoice_number,
                    "last_invoice_date": invoice_date,
                    "updated_at": datetime.utcnow(),
                },
                "$setOnInsert": {"low_stock_threshold": LOW_STOCK_THRESHOLD_DEFAULT},
                "$inc": {"qty_in_stock": qty}
            },
            upsert=True
        )

