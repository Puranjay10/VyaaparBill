const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getInvoices,
    getInvoiceById,
    downloadInvoice,
} = require("../controllers/invoiceController");

router.get("/", protect, getInvoices);

router.get("/:id", protect, getInvoiceById);

router.get(
    "/:id/download",
    protect,
    downloadInvoice
);

module.exports = router;