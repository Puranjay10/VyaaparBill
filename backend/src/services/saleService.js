const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const ApiError = require("../utils/ApiError");
const invoiceService = require("./invoiceService");

const createSale = async (
  {
    customerId,
    products,
    totalAmount,
  },
  userId
) => {
  // Validate Customer
  const customer = await Customer.findOne({
    _id: customerId,
    user: userId,
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  // Validate Products & Stock
  for (const item of products) {
    const product = await Product.findOne({
      _id: item.productId,
      user: userId,
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.quantity < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for ${product.name}`
      );
    }
  }

  // Create Sale
  const sale = await Sale.create({
    user: userId,
    customerId,
    products,
    totalAmount,
  });

  // Reduce Inventory
  for (const item of products) {
    await Product.findOneAndUpdate(
      {
        _id: item.productId,
        user: userId,
      },
      {
        $inc: {
          quantity: -item.quantity,
        },
      }
    );
  }

  const invoice = await invoiceService.createInvoice(
    sale._id,
    userId
  );

  return {
    sale,
    invoice,
  };
};

module.exports = {
  createSale,
};