const Invoice = require("../models/Invoice");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

const generateInvoiceNumber = require("../utils/generateInvoiceNumber");
const calculateGST = require("../utils/calculateGST");

const createInvoice = async (
  saleId,
  userId,
  session
) => {
  const sale = await Sale.findOne({
    _id: saleId,
    user: userId,
  }).session(session);

  if (!sale) {
    throw new Error("Sale not found");
  }

  const invoiceNumber = await generateInvoiceNumber(
    userId,
    session
  );

  const totals = await calculateGST(
    sale.products,
    userId,
    session
  );

  const items = [];

  for (const item of sale.products) {
    const product = await Product.findOne({
      _id: item.productId,
      user: userId,
    }).session(session);

    if (!product) {
      throw new Error("Product not found");
    }

    const total =
      item.quantity * item.sellingPrice;

    items.push({
      productName: product.name,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      gstRate: product.gstRate,
      total,
    });
  }

  const [invoice] = await Invoice.create(
    [
      {
        user: userId,
        invoiceNumber,
        saleId: sale._id,
        customerId: sale.customerId,
        items,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        totalAmount: totals.totalAmount,
      },
    ],
    {
      session,
    }
  );

  return invoice;
};

module.exports = {
  createInvoice,
};