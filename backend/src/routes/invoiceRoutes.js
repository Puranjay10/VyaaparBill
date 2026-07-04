const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getInvoiceById,
    downloadInvoice,
} = require("../controllers/invoiceController");

router.get("/:id", protect, getInvoiceById);

router.get(
    "/:id/download",
    // protect,
    downloadInvoice
);

module.exports = router;