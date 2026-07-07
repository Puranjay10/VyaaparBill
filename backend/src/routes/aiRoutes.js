const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
    processInvoiceController,
} = require("../controllers/aiController");

// const protect = require("../middleware/authMiddleware");

router.post(
    "/process-invoice",
    // protect,
    upload.single("file"),
    processInvoiceController
);

module.exports = router;