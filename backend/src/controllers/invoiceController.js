const asyncHandler = require("../utils/asyncHandler");
const Invoice = require("../models/Invoice");
const generateInvoicePDF = require("../invoices/invoiceTemplate");

const getInvoiceById = asyncHandler(async (req, res) => {

const invoice = await Invoice.findOne({
  _id: req.params.id,
  user: req.user.userId,
})
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

const invoice = await Invoice.findOne({
  _id: req.params.id,
  user: req.user.userId,
})        .populate("customerId");

    if (!invoice) {

        return res.status(404).json({
            message: "Invoice not found",
        });

    }

    generateInvoicePDF(invoice, res);

});

const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    user: req.user.userId,
  });

  res.status(200).json(invoices);
});

module.exports = {
    getInvoiceById,
    downloadInvoice,
    getInvoices,
};