const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");

const createPurchase = async (purchaseData, userId) => {
  const supplier = await Supplier.findOne({
    _id: purchaseData.supplierId,
    user: userId,
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

    const productIds = [
    ...new Set(
        purchaseData.products.map(
        (item) => item.productId.toString()
        )
    ),
    ];

  const products = await Product.find({
    _id: { $in: productIds },
    user: userId,
  });

  if (products.length !== productIds.length) {
    throw new Error(
      "One or more products were not found"
    );
  }

  const purchase = await Purchase.create({
    user: userId,
    supplierId: purchaseData.supplierId,
    invoiceNumber: purchaseData.invoiceNumber,
    products: purchaseData.products,
    totalAmount: purchaseData.totalAmount,
  });

  for (const item of purchase.products) {
    await Product.findOneAndUpdate(
      {
        _id: item.productId,
        user: userId,
      },
      {
        $inc: {
          quantity: item.quantity,
        },
      }
    );
  }

  return purchase;
};

module.exports = {
  createPurchase,
};