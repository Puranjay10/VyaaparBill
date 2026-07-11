const mongoose=require("mongoose");

const productSchema=new mongoose.Schema(
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

    productCode: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
    },

    purchasePrice: {
      type: Number,
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    gstRate: {
      type: Number,
      default: 18,
    },

    supplier: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index(
  { user: 1, productCode: 1 },
  { unique: true }
);

module.exports=mongoose.model("Product",productSchema);