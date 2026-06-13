const express=require("express");

const router=express.Router();

const protect=require("../middleware/authMiddleware");

const {createProduct,
        getProducts,
        getProductById,
        updateProduct,
        deleteProduct,
}=require("../controllers/productController");

router.post("/",protect,createProduct);
router.get("/",protect,getProducts);
router.get("/:id",protect,getProductById);
router.put("/:id",protect,updateProduct);
router.delete("/:id",protect,deleteProduct);

module.exports=router;