const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
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

module.exports = mongoose.model("Invoice", invoiceSchema);