const mongoose=require("mongoose");
const purchaseSchema=new mongoose.Schema(
     {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    invoiceNumber: {
    type: String,
    required: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        purchasePrice: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index(
  { user: 1, supplierId: 1, invoiceNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Purchase",
  purchaseSchema
)