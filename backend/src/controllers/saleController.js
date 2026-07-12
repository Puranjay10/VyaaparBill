const Sale = require("../models/Sale");
const saleService = require("../services/saleService");
const asyncHandler = require("../utils/asyncHandler");

const createSale = asyncHandler(async (req, res) => {

const result = await saleService.createSale(
  req.body,
  req.user.userId
);

  res.status(201).json({
      message: "Sale created successfully",
      sale: result.sale,
      invoice: result.invoice,
  });

});

const getSales = async (req, res) => {
  try {

const sales = await Sale.find({
  user: req.user.userId,
})
  .populate("customerId")
  .populate("products.productId");

    res.status(200).json(sales);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const getSaleById = async (req, res) => {
  try {

const sale = await Sale.findOne({
  _id: req.params.id,
  user: req.user.userId,
})
      .populate("customerId")
      .populate("products.productId");

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.status(200).json(sale);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  createSale,
  getSales,
  getSaleById,
};