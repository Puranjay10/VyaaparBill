def validate_invoice(invoice):

    required_fields = [
        "supplier",
        "invoiceNumber",
        "invoiceDate",
        "products"
    ]

    for field in required_fields:

        if field not in invoice:
            raise Exception(f"Missing field: {field}")

    if not isinstance(invoice["products"], list):
        raise Exception("Products must be a list")

    if len(invoice["products"]) == 0:
        raise Exception("Invoice contains no products")

    return invoice