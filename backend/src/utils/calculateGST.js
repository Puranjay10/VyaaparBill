const Product = require("../models/Product");

const calculateGST = async (
  products,
  userId,
  session
) => {
  let subtotal = 0;
  let gstAmount = 0;

  for (const item of products) {
    const product = await Product.findOne({
      _id: item.productId,
      user: userId,
    }).session(session);

    if (!product) {
      throw new Error("Product not found");
    }

    const itemTotal =
      item.quantity * item.sellingPrice;

    subtotal += itemTotal;

    gstAmount +=
      itemTotal * (product.gstRate / 100);
  }

  return {
    subtotal,
    gstAmount,
    totalAmount: subtotal + gstAmount,
  };
};

module.exports = calculateGST;