const User= require("../models/user");
const bcrypt=require("bcryptjs");

const registerUser=async(req,res)=>{
    try{
        const{ name,email,password}=req.body;

        const existingUser=await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                message:"user already exists",
            });
        }

        const hashedPassword=await bcrypt.hash(password,10);
        
        const user=await User.create({
            name,
            email,
            password:hashedPassword,
        });

        res.status(201).json({
            message:"User registered successfully",
            user,
        });
    } catch(error){
        res.status(500).json({
            message:error.message,
        });
    }
};

module.exports={
    registerUser,
};