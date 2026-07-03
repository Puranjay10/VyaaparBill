const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer=require("../models/Customer");

const createSale = async (req, res) => {
  try {

    const {
      customerId,
      products,
      totalAmount,
    } = req.body;

    // Step 1: Validate Customer

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Step 2: Validate Products & Stock

    for (const item of products) {

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: `Product not found`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }
    }

    // Step 3: Create Sale

    const sale = await Sale.create({
      customerId,
      products,
      totalAmount,
    });

    // Step 4: Reduce Inventory

    for (const item of products) {

      const product = await Product.findById(item.productId);

      product.quantity -= item.quantity;

      await product.save();
    }

    res.status(201).json({
      message: "Sale created successfully",
      sale,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const getSales = async (req, res) => {
  try {

    const sales = await Sale.find()
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

    const sale = await Sale.findById(req.params.id)
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