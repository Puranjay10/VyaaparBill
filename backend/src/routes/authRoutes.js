const express=require("express");

const router=express.Router();

const{
    registerUser,
    loginUser,
}=require("../controllers/authController");

const{
    registerValidator,
    loginValidator,
}=require("../validators/authValidator");

const validate=require("../middleware/validationMiddleware");

router.post("/register",registerValidator,validate,registerUser);
router.post("/login",loginValidator,validate,loginUser);

module.exports=router;