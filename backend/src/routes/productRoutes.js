const express=require("express");
const validateProduct = require("../validators/productValidator");
const validate = require("../middleware/validationMiddleware");

const router=express.Router();

const protect=require("../middleware/authMiddleware");

const {createProduct,
        getProducts,
        getProductById,
        updateProduct,
        deleteProduct,
        searchProducts,
}=require("../controllers/productController");

router.post("/",protect,validateProduct,validate,createProduct);
router.get("/",protect,getProducts);
router.get("/search",protect,searchProducts);
router.get("/:id",protect,getProductById);
router.put("/:id",protect,updateProduct);
router.delete("/:id",protect,deleteProduct);

module.exports=router;