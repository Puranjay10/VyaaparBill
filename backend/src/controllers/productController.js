const Product=require("../models/Product");

//Create product
const createProduct=async(req,res)=>{
    try{
        const{
            name,
            productCode,
            category,
            quantity,
            purchasePrice,
            sellingPrice,
            gstRate,
            supplier,
        }=req.body;

        const existingProduct=await Product.findOne({productCode});

        if(existingProduct){
            return res.status(400).json({
                message:"Product code already exists",
            });
        }

        const product = await Product.create({
            name,
            productCode,
            category,
            quantity,
            purchasePrice,
            sellingPrice,
            gstRate,
            supplier,
        });

        res.status(201).json(product);
    }

    catch(error){
        res.status(500).json({
            message: error.message,
    });
    }
};


//Gt All Products
const getProducts = async (req, res) => {
  try {

    const products = await Product.find();

    res.status(200).json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


//Get product by id 
const getProductById=async(req,res)=>{
    try{
        const product=await Product.findById(
            req.params.id
        );

        if(!product){
            return res.status(404).json({
                message:"Product not found",
            });
        }
        res.status(200).json(product);
    }
    catch(error){
        res.status(500).json({
            msesage:error.message,
        });
    }
};


//Update Product
const updateProduct=async (req,res)=>{
    try{
        const product= await Product.findById(
            req.params.id
        );

        if(!product){
            return res.staus(404).json({
                message:"Product not found",
            });
        }

        const updatedProduct=
        await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new:true,
            }
        );
        res.status(200).json(updatedProduct); 
    }

    catch(error){
        res.status(500).json({
            message:error.message,
        });
    }
};


//Delete Product
const deleteProduct = async (req, res) => {
  try {

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message: "Product deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

//Search Products
const searchProducts = async (req, res) => {
  try {

    const keyword = req.query.name;

    const products = await Product.find({
      name: {
        $regex: keyword,
        $options: "i",
      },
    });

    res.status(200).json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

module.exports={
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
};