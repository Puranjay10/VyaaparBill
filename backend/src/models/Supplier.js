const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index(
  { user: 1, email: 1 },
  { unique: true }
);

supplierSchema.index(
  { user: 1, gstNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Supplier",
  supplierSchema
);