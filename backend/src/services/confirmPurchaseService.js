const mongoose = require("mongoose");

const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");

const {
  createPurchase,
} = require("./purchaseService");

const confirmPurchase = async (
  invoice,
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let purchase;

    await session.withTransaction(async () => {
      // Find or create supplier
      let supplier = await Supplier.findOne({
        user: userId,
        gstNumber: invoice.supplier.gstNumber,
      }).session(session);

      if (!supplier) {
        [supplier] = await Supplier.create(
          [
            {
              user: userId,
              name: invoice.supplier.name,
              email: invoice.supplier.email,
              phone: invoice.supplier.phone,
              gstNumber:
                invoice.supplier.gstNumber,
              address: invoice.supplier.address,
            },
          ],
          {
            session,
          }
        );
      }

      const existingPurchase =
        await Purchase.findOne({
          user: userId,
          supplierId: supplier._id,
          invoiceNumber: invoice.invoiceNumber,
        }).session(session);

      if (existingPurchase) {
        throw new Error(
          "This invoice has already been imported."
        );
      }

      const purchaseProducts = [];

      for (const item of invoice.products) {
        let product = await Product.findOne({
          user: userId,
          name: item.name,
        }).session(session);

        if (!product) {
          [product] = await Product.create(
            [
              {
                user: userId,
                name: item.name,
                productCode:
                  `AI-${Date.now()}-${Math.floor(
                    Math.random() * 1000
                  )}`,
                category: "Imported",
                quantity: 0,
                purchasePrice: item.purchasePrice,
                sellingPrice: item.purchasePrice,
                gstRate: item.gstRate,
                supplier: supplier.name,
              },
            ],
            {
              session,
            }
          );
        }

        purchaseProducts.push({
          productId: product._id,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        });
      }

      const totalAmount = Number(
        invoice.products
          .reduce((total, item) => {
            return (
              total +
              item.quantity * item.purchasePrice
            );
          }, 0)
          .toFixed(2)
      );

      const purchaseData = {
        supplierId: supplier._id,
        invoiceNumber: invoice.invoiceNumber,
        products: purchaseProducts,
        totalAmount,
      };

      purchase = await createPurchase(
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
  confirmPurchase,
};