const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    outstandingBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Customer",
  customerSchema
);