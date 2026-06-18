const mongoose=require("mongoose");

const supplierSchema=new mongoose.Schema(
    {
        name: {
        type: String,
        required: true,
        trim: true,
        },

        email: {
        type: String,
        required: true,
        unique: true,
        },

        phone: {
        type: String,
        required: true,
        },

        gstNumber: {
        type: String,
        required: true,
        unique: true,
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

    module.exports = mongoose.model(
    "Supplier",
    supplierSchema
);