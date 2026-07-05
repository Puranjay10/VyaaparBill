const PDFDocument = require("pdfkit");

const PAGE = {
    LEFT: 50,
    RIGHT: 545,
    WIDTH: 495,
};

const COL = {
    PRODUCT: 55,
    QTY: 280,
    RATE: 340,
    GST: 410,
    AMOUNT: 475,
};

function currency(value) {
    return `₹${Number(value).toFixed(2)}`;
}

function drawHorizontalLine(doc) {
    doc
        .strokeColor("#BDBDBD")
        .lineWidth(1)
        .moveTo(PAGE.LEFT, doc.y)
        .lineTo(PAGE.RIGHT, doc.y)
        .stroke();

    doc.moveDown(0.6);
}

function drawSectionTitle(doc, title) {

    doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#000000")
        .text(title);

    doc.moveDown(0.3);

}

function drawKeyValue(doc, key, value) {

    doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`${key}`, {
            continued: true,
        });

    doc
        .font("Helvetica")
        .text(` ${value}`);

}

function drawTableHeader(doc) {

    const y = doc.y;

    doc
        .rect(PAGE.LEFT, y, PAGE.WIDTH, 24)
        .fill("#F2F2F2");

    doc
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(10);

    doc.text("Product", COL.PRODUCT, y + 7);

    doc.text("Qty", COL.QTY, y + 7);

    doc.text("Rate", COL.RATE, y + 7);

    doc.text("GST", COL.GST, y + 7);

    doc.text("Amount", COL.AMOUNT, y + 7);

    doc.moveDown(2);

}

function generateInvoicePDF(invoice, res) {

    const doc = new PDFDocument({

        size: "A4",

        margin: 50,

    });

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // ===================================
    // HEADER
    // ===================================

    doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .text("VyaaparBill", {
            align: "center",
        });

    doc
        .font("Helvetica")
        .fontSize(13)
        .text(
            "Business Management Platform",
            {
                align: "center",
            }
        );

    doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(
            "TAX INVOICE",
            {
                align: "center",
            }
        );

    doc.moveDown();

    drawHorizontalLine(doc);

    // ===================================
    // BUSINESS DETAILS
    // ===================================

    drawSectionTitle(
        doc,
        "Business Details"
    );

    drawKeyValue(
        doc,
        "Company :",
        "VyaaparBill Pvt. Ltd."
    );

    drawKeyValue(
        doc,
        "Address :",
        "Bhopal, Madhya Pradesh"
    );

    drawKeyValue(
        doc,
        "GSTIN :",
        "23ABCDE1234F1Z5"
    );

    drawKeyValue(
        doc,
        "Email :",
        "support@vyaaparbill.com"
    );

    doc.moveDown();

    drawHorizontalLine(doc);

    // ===================================
    // INVOICE DETAILS
    // ===================================

    drawSectionTitle(
        doc,
        "Invoice Details"
    );

    drawKeyValue(
        doc,
        "Invoice No :",
        invoice.invoiceNumber
    );

    drawKeyValue(
        doc,
        "Invoice Date :",
        new Date(
            invoice.invoiceDate
        ).toLocaleDateString()
    );

    doc.moveDown();

    drawHorizontalLine(doc);

    // ===================================
    // BILL TO
    // ===================================

    drawSectionTitle(
        doc,
        "Bill To"
    );

    drawKeyValue(
        doc,
        "Name :",
        invoice.customerId.name
    );

    drawKeyValue(
        doc,
        "Address :",
        invoice.customerId.address
    );

    drawKeyValue(
        doc,
        "Phone :",
        invoice.customerId.phone
    );

    drawKeyValue(
        doc,
        "Email :",
        invoice.customerId.email
    );

    doc.moveDown();

    drawHorizontalLine(doc);

        // ===================================
    // PRODUCTS TABLE
    // ===================================

    drawSectionTitle(doc, "Products");

    drawTableHeader(doc);

    doc.font("Helvetica").fontSize(10);

    invoice.items.forEach((item) => {

        // Add new page if needed
        if (doc.y > 700) {

            doc.addPage();

            drawSectionTitle(doc, "Products");

            drawTableHeader(doc);

        }

        const y = doc.y;

        // Row border
        doc
            .rect(PAGE.LEFT, y - 3, PAGE.WIDTH, 22)
            .stroke("#DDDDDD");

        doc
            .fillColor("#000000")
            .font("Helvetica");

        doc.text(
            item.productName,
            COL.PRODUCT,
            y + 4,
            {
                width: 200,
            }
        );

        doc.text(
            item.quantity.toString(),
            COL.QTY,
            y + 4
        );

        doc.text(
            currency(item.sellingPrice),
            COL.RATE,
            y + 4
        );

        doc.text(
            `${item.gstRate}%`,
            COL.GST,
            y + 4
        );

        doc.text(
            currency(item.total),
            COL.AMOUNT,
            y + 4
        );

        doc.y = y + 24;

    });

    doc.moveDown();

    drawHorizontalLine(doc);

        // ===================================
    // TOTALS
    // ===================================

    doc.moveDown();

    const totalsX = 330;

    doc
        .font("Helvetica")
        .fontSize(11);

    doc.text("Subtotal", totalsX, doc.y);
    doc.text(
        currency(invoice.subtotal),
        470,
        doc.y - 15,
        {
            width: 70,
            align: "right",
        }
    );

    doc.text("GST", totalsX, doc.y);
    doc.text(
        currency(invoice.gstAmount),
        470,
        doc.y - 15,
        {
            width: 70,
            align: "right",
        }
    );

    // Grand Total Box

    doc.moveDown(0.5);

    const boxY = doc.y;

    doc
        .rect(320, boxY, 225, 32)
        .fillAndStroke("#F5F5F5", "#CFCFCF");

    doc
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(12);

    doc.text(
        "GRAND TOTAL",
        330,
        boxY + 10
    );

    doc.text(
        currency(invoice.totalAmount),
        445,
        boxY + 10,
        {
            width: 90,
            align: "right",
        }
    );

    doc.moveDown(4);

    drawHorizontalLine(doc);

    // ===================================
    // FOOTER
    // ===================================

    doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#555555")
        .text(
            "Thank you for choosing VyaaparBill!",
            {
                align: "center",
            }
        );

    doc.text(
        "This is a computer-generated invoice.",
        {
            align: "center",
        }
    );

    doc.moveDown(2);

    doc
        .font("Helvetica-Bold")
        .fillColor("#000000");

    doc.text(
        "Authorized Signature",
        380,
        doc.y
    );

    doc.moveDown(2);

    drawHorizontalLine(doc);

    doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#777777")
        .text(
            `Generated on: ${new Date().toLocaleString()}`,
            {
                align: "center",
            }
        );

    doc.end();

}

module.exports = generateInvoicePDF;