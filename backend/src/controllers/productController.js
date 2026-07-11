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

        const existingProduct = await Product.findOne({
          user: req.user.userId,
          productCode,
        });

        if(existingProduct){
            return res.status(400).json({
                message:"Product code already exists",
            });
        }

        const product = await Product.create({
            user: req.user.userId,
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

    const page=Number(req.query.page) || 1;
    const limit=Number(req.query.limit)|| 5;

    const skip=(page-1)*limit;

    const sortField=req.query.sort || "createdAt";

    const products = await Product.find({
      user: req.user.userId,
    })
    .sort(sortField)
    .skip(skip)
    .limit(limit);

    const totalProducts = await Product.countDocuments({
      user: req.user.userId,
    });

    res.status(200).json({
      totalProducts,
      currentPage:page,
      totalPages:Math.ceil(
        totalProducts/ limit
      ),
      products
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


//Get product by id 
const getProductById=async(req,res)=>{
    try{
        const product = await Product.findOne({
          _id: req.params.id,
          user: req.user.userId,
        });
        if(!product){
            return res.status(404).json({
                message:"Product not found",
            });
        }
        res.status(200).json(product);
    }
    catch(error){
        res.status(500).json({
            message: error.message,
        });
    }
};


//Update Product
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      productCode,
      category,
      quantity,
      purchasePrice,
      sellingPrice,
      gstRate,
      supplier,
    } = req.body;

    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      {
        name,
        productCode,
        category,
        quantity,
        purchasePrice,
        sellingPrice,
        gstRate,
        supplier,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


//Delete Product
const deleteProduct = async (req, res) => {
  try {

        const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

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
      user: req.user.userId,
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