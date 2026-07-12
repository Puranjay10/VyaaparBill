const { body } = require("express-validator");

const validateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required"),

  body("productCode")
    .trim()
    .notEmpty()
    .withMessage("Product code is required"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be 0 or greater"),

  body("purchasePrice")
    .isFloat({ min: 0 })
    .withMessage(
      "Purchase price cannot be negative"
    ),

  body("sellingPrice")
    .isFloat({ min: 0 })
    .withMessage(
      "Selling price cannot be negative"
    ),

  body("gstRate")
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage(
      "GST rate must be between 0 and 100"
    ),
];

module.exports = validateProduct;