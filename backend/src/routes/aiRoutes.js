const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
    processInvoiceController,
    confirmPurchaseController,
} = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

router.post(
    "/process-invoice",
    protect,
    upload.single("file"),
    processInvoiceController
);

router.post(
    "/confirm-purchase",
    protect,
    confirmPurchaseController
);

module.exports = router;