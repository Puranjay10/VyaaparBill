const Supplier = require("../models/Supplier");
const Product = require("../models/Product");

const generatePurchasePreview = async (invoice, userId) => {
  const supplier = await Supplier.findOne({
    user: userId,
    gstNumber: invoice.supplier.gstNumber,
  });

  const preview = {
    supplier: {
      name: invoice.supplier.name,
      exists: !!supplier,
      supplierId: supplier?._id || null,
    },

    products: [],
  };

  for (const item of invoice.products) {
    const product = await Product.findOne({
      user: userId,
      name: item.name,
    });

    preview.products.push({
      name: item.name,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      gstRate: item.gstRate,
      exists: !!product,
      productId: product?._id || null,
    });
  }

  return preview;
};

module.exports = {
  generatePurchasePreview,
};