const { body } = require("express-validator");

const purchaseValidator = [

    body("supplierId")
        .notEmpty()
        .withMessage("Supplier is required"),

    body("products")
        .isArray({ min: 1 })
        .withMessage("At least one product is required"),

    body("totalAmount")
        .isFloat({ min: 0 })
        .withMessage("Total amount must be positive"),

];

module.exports = purchaseValidator;