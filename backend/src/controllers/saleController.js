const Sale = require("../models/Sale");
const Product = require("../models/Product");

const createSale = async (req, res) => {
  try {

    const {
      customerId,
      products,
      totalAmount,
    } = req.body;

    const sale = await Sale.create({
      customerId,
      products,
      totalAmount,
    });

    for (const item of products) {

      const product =
        await Product.findById(
          item.productId
        );

      if (product) {

        product.quantity -= item.quantity;

        await product.save();

      }
    }

    res.status(201).json(sale);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

module.exports = {
  createSale,
};