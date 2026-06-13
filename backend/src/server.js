require("dotenv").config();

const express=require("express");
const cors=require("cors");
const authRoutes=require("./routes/authRoutes");
const protect=require("./middleware/authMiddleware");
const productRoutes=require("./routes/productRoutes");

const connectDB=require("./config/db");

const app=express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth",authRoutes);

app.use("/api/products",productRoutes);

app.get("/",(req,res)=>{
    res.send("VyaaparBill backend running.");
});

app.get("/api/test",protect,(req,res)=>{

    res.json({
        message:"Protected route accessed",
        user:req.user,
    });
});

const PORT= process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});