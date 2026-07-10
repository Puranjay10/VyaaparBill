const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

const createPurchase = async (purchaseData) => {

    const purchase = await Purchase.create({

        supplierId: purchaseData.supplierId,

        invoiceNumber: purchaseData.invoiceNumber,

        products: purchaseData.products,

        totalAmount: purchaseData.totalAmount,

    });

    for (const item of purchase.products) {

        const product = await Product.findById(item.productId);

        if (product) {

            product.quantity += item.quantity;

            await product.save();

        }

    }

    return purchase;

};

module.exports = {
    createPurchase,
};