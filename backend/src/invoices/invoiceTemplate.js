const PDFDocument = require("pdfkit");

const PAGE = {
    LEFT: 50,
    RIGHT: 545,
};

const COL = {
    PRODUCT: 50,
    QTY: 270,
    RATE: 340,
    GST: 415,
    AMOUNT: 485,
};

function drawLine(doc) {
    doc
        .moveTo(PAGE.LEFT, doc.y)
        .lineTo(PAGE.RIGHT, doc.y)
        .stroke();
}

const generateInvoicePDF = (invoice, res) => {

    const doc = new PDFDocument({
        size: "A4",
        margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // ===============================
    // HEADER
    // ===============================

    doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .text("VyaaparBill", {
            align: "center",
        });

    doc
        .font("Helvetica")
        .fontSize(13)
        .text("Business Management Platform", {
            align: "center",
        });

    doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("TAX INVOICE", {
            align: "center",
        });

    doc.moveDown(0.8);

    drawLine(doc);

    doc.moveDown();

    // ===============================
    // BUSINESS DETAILS
    // ===============================

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Business Details");

    doc
        .font("Helvetica")
        .fontSize(11);

    doc.text("VyaaparBill Pvt. Ltd.");
    doc.text("Bhopal, Madhya Pradesh");
    doc.text("GSTIN : 23ABCDE1234F1Z5");
    doc.text("Email : support@vyaaparbill.com");

    doc.moveDown();

    drawLine(doc);

    doc.moveDown();

    // ===============================
    // INVOICE DETAILS
    // ===============================

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Invoice Details");

    doc
        .font("Helvetica")
        .fontSize(11);

    doc.text(`Invoice No : ${invoice.invoiceNumber}`);

    doc.text(
        `Invoice Date : ${new Date(
            invoice.invoiceDate
        ).toLocaleDateString()}`
    );

    doc.moveDown();

    drawLine(doc);

    doc.moveDown();

    // ===============================
    // CUSTOMER
    // ===============================

    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Bill To");

    doc
        .font("Helvetica")
        .fontSize(11);

    doc.text(`Name    : ${invoice.customerId.name}`);

    doc.text(`Address : ${invoice.customerId.address}`);

    doc.text(`Phone   : ${invoice.customerId.phone}`);

    doc.text(`Email   : ${invoice.customerId.email}`);

    doc.moveDown();

    drawLine(doc);

    doc.moveDown();