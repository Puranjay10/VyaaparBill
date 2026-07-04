const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const ApiError=require("../utils/ApiError");
const invoiceService=require("./invoiceService");

const createSale = async ({
  customerId,
  products,
  totalAmount,
}) => {

  // Validate Customer
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new ApiError(404,"Customer not found");
  }

  // Validate Products & Stock
  for (const item of products) {

    const product = await Product.findById(item.productId);

    if (!product) {
      throw new ApiError(404,"Product not found");
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
    customerId,
    products,
    totalAmount,
  });

  // Reduce Inventory
  for (const item of products) {

    const product = await Product.findById(item.productId);

    product.quantity -= item.quantity;

    await product.save();
  }

  const invoice = await invoiceService.createInvoice(
    sale._id
  );
  
  return{
    sale,
    invoice,
  };

};

module.exports = {
  createSale,
};