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
    totalAmount,
  },
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let sale;
    let invoice;

    await session.withTransaction(async () => {
      // Validate Customer
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

      // Create Sale
      [sale] = await Sale.create(
        [
          {
            user: userId,
            customerId,
            products,
            totalAmount,
          },
        ],
        {
          session,
        }
      );

      // Atomically validate and reduce inventory
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
      }

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