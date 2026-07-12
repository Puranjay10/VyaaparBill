const { body } = require("express-validator");

const purchaseValidator = [
  body("supplierId")
    .notEmpty()
    .withMessage("Supplier is required")
    .isMongoId()
    .withMessage("Invalid supplier ID"),

  body("invoiceNumber")
    .trim()
    .notEmpty()
    .withMessage("Invoice number is required"),

  body("products")
    .isArray({ min: 1 })
    .withMessage(
      "At least one product is required"
    )
    .custom((products) => {
      const productIds = products.map(
        (item) => item.productId
      );

      if (
        new Set(productIds).size !==
        productIds.length
      ) {
        throw new Error(
          "Duplicate products are not allowed"
        );
      }

      return true;
    }),

  body("products.*.productId")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage(
      "Product quantity must be at least 1"
    ),

  body("products.*.purchasePrice")
    .isFloat({ min: 0 })
    .withMessage(
      "Purchase price cannot be negative"
    ),
];

module.exports = purchaseValidator;