const { body } = require("express-validator");

const saleValidator = [

    body("customerId")
        .notEmpty()
        .withMessage("Customer is required"),

    body("products")
        .isArray({ min: 1 })
        .withMessage("At least one product is required"),

    body("totalAmount")
        .isFloat({ min: 0 })
        .withMessage("Total amount must be positive"),

];

module.exports = saleValidator;