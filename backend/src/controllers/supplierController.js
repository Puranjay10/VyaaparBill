const Supplier=require("../models/Supplier");

const createSupplier = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      gstNumber,
      address,
    } = req.body;

    const existingSupplier =
      await Supplier.findOne({
        gstNumber,
      });

    if (existingSupplier) {
      return res.status(400).json({
        message:
          "Supplier already exists",
      });
    }

    const supplier =
      await Supplier.create({
        name,
        email,
        phone,
        gstNumber,
        address,
      });

    res.status(201).json(supplier);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


const getSuppliers = async (req, res) => {
  try {

    const suppliers = await Supplier.find();

    res.status(200).json(suppliers);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


const getSupplierById = async (req, res) => {
  try {

    const supplier = await Supplier.findById(
      req.params.id
    );

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json(supplier);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


const updateSupplier = async (req, res) => {
  try {

    const supplier =
      await Supplier.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json(supplier);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


const deleteSupplier = async (req, res) => {
  try {

    const supplier =
      await Supplier.findByIdAndDelete(
        req.params.id
      );

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      message:
        "Supplier deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};