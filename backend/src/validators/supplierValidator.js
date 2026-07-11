const { body } = require("express-validator");

const supplierValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Supplier name is required"),

    body("email")
        .isEmail()
        .withMessage("Enter a valid email"),

    body("phone")
        .optional({ checkFalsy: true })
        .trim()
        .isString(),

    body("gstNumber")
        .trim()
        .notEmpty()
        .withMessage("GST Number is required"),

    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required"),

];

module.exports = supplierValidator;
