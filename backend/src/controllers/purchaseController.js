const { createPurchase } = require("../services/purchaseService");
const Purchase = require("../models/Purchase");

const createPurchaseController = async (req, res) => {

    try {

        const purchase = await createPurchase(req.body);

        res.status(201).json(purchase);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

const getPurchases = async (req, res) => {

    try {

        const purchases = await Purchase.find()
            .populate("supplierId")
            .populate("products.productId");

        res.status(200).json(purchases);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

module.exports = {
    createPurchase: createPurchaseController,
    getPurchases,
};