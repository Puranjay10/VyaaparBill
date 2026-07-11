const Supplier = require("../models/Supplier");
const Product = require("../models/Product");

const { createPurchase } = require("./purchaseService");

const confirmPurchase = async (invoice,userId) => {

    // Find or create supplier        
    let supplier = await Supplier.findOne({
        user: userId,
        gstNumber: invoice.supplier.gstNumber,
    });

    if (!supplier) {

        const supplierData = {
  user: userId,
  name: invoice.supplier.name,
  email: invoice.supplier.email,
  gstNumber: invoice.supplier.gstNumber,
  address: invoice.supplier.address,
};

        if (
            typeof invoice.supplier.phone === "string" &&
            invoice.supplier.phone.trim()
        ) {
            supplierData.phone = invoice.supplier.phone;
        }

        supplier = await Supplier.create(supplierData);

    }

    const Purchase = require("../models/Purchase");

const existingPurchase = await Purchase.findOne({
  user: userId,
  supplierId: supplier._id,
  invoiceNumber: invoice.invoiceNumber,
});

if (existingPurchase) {
    throw new Error("This invoice has already been imported.");
}

    // Prepare purchase products
    const purchaseProducts = [];

    for (const item of invoice.products) {

       let product = await Product.findOne({
  user: userId,
  name: item.name,
});

        if (!product) {

            product = await Product.create({
  user: userId,
  name: item.name,
  productCode: `AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  category: "Imported",
  quantity: 0,
  purchasePrice: item.purchasePrice,
  sellingPrice: item.purchasePrice,
  gstRate: item.gstRate,
  supplier: supplier.name,
});

        }

        purchaseProducts.push({

            productId: product._id,

            quantity: item.quantity,

            purchasePrice: item.purchasePrice,

        });

    }

    // Calculate total purchase amount
    const totalAmount = Number(
        invoice.products
            .reduce((total, item) => {
                return total + (item.quantity * item.purchasePrice);
            }, 0)
            .toFixed(2)
    );

    // Build purchase payload
    const purchaseData = {

        supplierId: supplier._id,

        invoiceNumber: invoice.invoiceNumber,

        products: purchaseProducts,

        totalAmount,

    };

    // Reuse existing Purchase Service
const purchase = await createPurchase(
  purchaseData,
  userId
);
    return purchase;

};

module.exports = {
    confirmPurchase,
};
