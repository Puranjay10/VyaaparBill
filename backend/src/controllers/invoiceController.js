const asyncHandler = require("../utils/asyncHandler");
const Invoice = require("../models/Invoice");
const generateInvoicePDF = require("../invoices/invoiceTemplate");

const getInvoiceById = asyncHandler(async (req, res) => {

    const invoice = await Invoice.findById(req.params.id)
        .populate("customerId")
        .populate("saleId");

    if (!invoice) {
        return res.status(404).json({
            message: "Invoice not found",
        });
    }

    res.status(200).json(invoice);

});

const downloadInvoice = asyncHandler(async (req, res) => {

    const invoice = await Invoice.findById(req.params.id)
        .populate("customerId");

    if (!invoice) {

        return res.status(404).json({
            message: "Invoice not found",
        });

    }

    generateInvoicePDF(invoice, res);

});


module.exports = {
    getInvoiceById,
    downloadInvoice,
};