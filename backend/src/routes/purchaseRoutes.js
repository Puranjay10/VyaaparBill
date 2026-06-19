const express=require("express");
const router=express.Router();

const protect=require("../middleware/authMiddleware");

const{
    createPurchase,
}=require("../controllers/purchaseController");

router.post(
    "/",
    protect,
    createPurchase
);

module.exports=router;