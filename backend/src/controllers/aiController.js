const { processInvoice } = require("../services/aiService");

const processInvoiceController = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No invoice uploaded",
            });
        }

        const result = await processInvoice(req.file.path);

        res.status(200).json(result);

    } catch (error) {

        res.status(500).json({
            message: error.response?.data || error.message,
        });

    }

};

module.exports = {
    processInvoiceController,
};