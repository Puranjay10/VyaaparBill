const {
  processInvoice,
} = require("../services/aiService");

const {
  generatePurchasePreview,
} = require("../services/previewService");

const {
  confirmPurchase,
} = require("../services/confirmPurchaseService");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const processInvoiceController = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      throw new ApiError(
        400,
        "No invoice uploaded"
      );
    }

    const result = await processInvoice(
      req.file.path
    );

    const preview = await generatePurchasePreview(
      result.invoice,
      req.user.userId
    );

    res.status(200).json({
      message:
        "Purchase preview generated successfully",
      preview,
      invoice: result.invoice,
    });
  }
);

const confirmPurchaseController = asyncHandler(
  async (req, res) => {
    const purchase = await confirmPurchase(
      req.body.invoice,
      req.user.userId
    );

    res.status(201).json({
      message: "Purchase created successfully",
      purchase,
    });
  }
);

module.exports = {
  processInvoiceController,
  confirmPurchaseController,
};