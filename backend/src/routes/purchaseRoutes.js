const express=require("express");
const router=express.Router();
const purchaseValidator = require("../validators/purchaseValidator");
const validate = require("../middleware/validationMiddleware");

const protect=require("../middleware/authMiddleware");

const{
    createPurchase,
    getPurchases,
}=require("../controllers/purchaseController");

router.post(
    "/",
    protect,
    purchaseValidator,
    validate,
    createPurchase
);

router.get(
    "/",protect,getPurchases
);

module.exports=router;