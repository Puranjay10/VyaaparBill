const { processInvoice } = require("../services/aiService");
const { generatePurchasePreview } = require("../services/previewService");
const { confirmPurchase } = require("../services/confirmPurchaseService");

const processInvoiceController = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No invoice uploaded",
            });
        }

        const result = await processInvoice(req.file.path);

       const preview = await generatePurchasePreview(
  result.invoice,
  req.user.userId
);

        res.status(200).json({
            message: "Purchase preview generated successfully",

            preview,

            invoice: result.invoice,
        });

    } catch (error) {

        res.status(500).json({
            message: error.response?.data || error.message,
        });

    }

};

const confirmPurchaseController = async (req, res) => {

    try {

const purchase = await confirmPurchase(
  req.body.invoice,
  req.user.userId
);
        res.status(201).json({

            message: "Purchase created successfully",

            purchase,

        });

    } catch (error) {

        res.status(500).json({

            message: error.message,

        });

    }

};

module.exports = {
    processInvoiceController,
    confirmPurchaseController,
};