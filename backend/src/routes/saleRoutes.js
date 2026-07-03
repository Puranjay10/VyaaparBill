const express = require("express");
const validateSale = require("../validators/saleValidator");
const validate = require("../middleware/validationMiddleware");

const router = express.Router();

const protect =
  require("../middleware/authMiddleware");

const {
  createSale,
  getSales,
  getSaleById,
} = require("../controllers/saleController");

router.get("/",protect,getSales);

router.get("/:id",protect,getSaleById);

router.post(
  "/",
  protect,
  validateSale,
  validate,
  createSale
);

module.exports = router;