const express = require("express");

const router = express.Router();

const protect =
  require("../middleware/authMiddleware");

const {
  createSale,
} = require("../controllers/saleController");

router.post(
  "/",
  protect,
  createSale
);

module.exports = router;