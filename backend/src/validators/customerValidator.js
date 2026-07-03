const { body } = require("express-validator");

const customerValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required"),

    body("email")
        .optional()
        .isEmail()
        .withMessage("Enter a valid email"),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required"),

    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required"),

];

module.exports = customerValidator;