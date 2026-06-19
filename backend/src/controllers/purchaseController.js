const Purchase=require("../models/Purchase");
const Product=require("../models/Product");

const createPurchase=async(req,res)=>{
    try{

        const{
            supplierId,
            products,
            totalAmount,
        }=req.body;

        const purchase=await Purchase.create({
            supplierId,
            products,
            totalAmount,
        });

        for(const item of products){
            const product=await Product.findById(
                item.productId
            );

            if(product){
                product.quantity += item.quantity;

                await product.save();
            }
        }

        res.status(201).json(purchase);
    } catch(error){
        res.status(500).json({
            message:error.message,
        });
    }
};

module.exports={
    createPurchase,
};