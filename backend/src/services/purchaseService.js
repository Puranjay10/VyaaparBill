const mongoose = require("mongoose");

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");

const executePurchase = async (
  purchaseData,
  userId,
  session
) => {
  const supplier = await Supplier.findOne({
    _id: purchaseData.supplierId,
    user: userId,
  }).session(session);

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
    _id: {
      $in: productIds,
    },
    user: userId,
  }).session(session);

    if (products.length !== productIds.length) {
        throw new Error(
        "One or more products were not found"
        );
    }

    let totalAmount = 0;

    for (const item of purchaseData.products) {
    totalAmount +=
        item.quantity * item.purchasePrice;
    }

    totalAmount = Number(
    totalAmount.toFixed(2)
    );

  const [purchase] = await Purchase.create(
    [
      {
        user: userId,
        supplierId: purchaseData.supplierId,
        invoiceNumber: purchaseData.invoiceNumber,
        products: purchaseData.products,
        totalAmount: purchaseData.totalAmount,
      },
    ],
    {
      session,
    }
  );

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
      },
      {
        session,
      }
    );
  }

  return purchase;
};

const createPurchase = async (
  purchaseData,
  userId,
  existingSession = null
) => {
  if (existingSession) {
    return executePurchase(
      purchaseData,
      userId,
      existingSession
    );
  }

  const session = await mongoose.startSession();

  try {
    let purchase;

    await session.withTransaction(async () => {
      purchase = await executePurchase(
        purchaseData,
        userId,
        session
      );
    });

    return purchase;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createPurchase,
};