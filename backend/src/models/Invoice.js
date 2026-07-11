const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

    user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},

    invoiceNumber: {
        type: String,
        required: true,
    },

    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        required: true,
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },

    subtotal: {
        type: Number,
        required: true,
    },

    gstAmount: {
        type: Number,
        required: true,
    },

    totalAmount: {
        type: Number,
        required: true,
    },

    invoiceDate: {
        type: Date,
        default: Date.now,
    },

    items: [
  {
    productName: String,
    quantity: Number,
    sellingPrice: Number,
    gstRate: Number,
    total: Number
  }
]

}, {
    timestamps: true,
});

invoiceSchema.index(
  { user: 1, invoiceNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);