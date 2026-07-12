const mongoose = require("mongoose");

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const ApiError = require("../utils/ApiError");
const invoiceService = require("./invoiceService");

const createSale = async (
  {
    customerId,
    products,
  },
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let sale;
    let invoice;

    await session.withTransaction(async () => {
      const customer = await Customer.findOne({
        _id: customerId,
        user: userId,
      }).session(session);

      if (!customer) {
        throw new ApiError(
          404,
          "Customer not found"
        );
      }

      const saleProducts = [];
      let totalAmount = 0;

      for (const item of products) {
        const product =
          await Product.findOneAndUpdate(
            {
              _id: item.productId,
              user: userId,
              quantity: {
                $gte: item.quantity,
              },
            },
            {
              $inc: {
                quantity: -item.quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!product) {
          throw new ApiError(
            400,
            "Product not found or insufficient stock"
          );
        }

        saleProducts.push({
          productId: product._id,
          quantity: item.quantity,
          sellingPrice: product.sellingPrice,
        });

        totalAmount +=
          item.quantity * product.sellingPrice;
      }

      [sale] = await Sale.create(
        [
          {
            user: userId,
            customerId,
            products: saleProducts,
            totalAmount,
          },
        ],
        {
          session,
        }
      );

      invoice =
        await invoiceService.createInvoice(
          sale._id,
          userId,
          session
        );
    });

    return {
      sale,
      invoice,
    };
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createSale,
};