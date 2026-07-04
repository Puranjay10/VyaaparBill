const Invoice = require("../models/Invoice");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

const generateInvoiceNumber = require("../utils/generateInvoiceNumber");
const calculateGST = require("../utils/calculateGST");

const createInvoice = async (saleId) => {

    const sale = await Sale.findById(saleId);

    if (!sale) {
        throw new Error("Sale not found");
    }

    const invoiceNumber = await generateInvoiceNumber();

    const totals = await calculateGST(sale.products);

    const items = [];

    for (const item of sale.products) {

        const product = await Product.findById(item.productId);

        const total = item.quantity * item.sellingPrice;

        items.push({

            productName: product.name,

            quantity: item.quantity,

            sellingPrice: item.sellingPrice,

            gstRate: product.gstRate,

            total,

        });

    }

    const invoice = await Invoice.create({

        invoiceNumber,

        saleId: sale._id,

        customerId: sale.customerId,

        items,

        subtotal: totals.subtotal,

        gstAmount: totals.gstAmount,

        totalAmount: totals.totalAmount,

    });

    return invoice;

};

module.exports = {
    createInvoice,
};