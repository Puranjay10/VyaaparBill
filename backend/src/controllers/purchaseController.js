const {
  createPurchase,
} = require("../services/purchaseService");

const Purchase = require("../models/Purchase");
const asyncHandler = require("../utils/asyncHandler");

const createPurchaseController = asyncHandler(
  async (req, res) => {
    const purchase = await createPurchase(
      req.body,
      req.user.userId
    );

    res.status(201).json(purchase);
  }
);

const getPurchases = asyncHandler(
  async (req, res) => {
    const purchases = await Purchase.find({
      user: req.user.userId,
    })
      .populate("supplierId")
      .populate("products.productId");

    res.status(200).json(purchases);
  }
);

module.exports = {
  createPurchase: createPurchaseController,
  getPurchases,
};