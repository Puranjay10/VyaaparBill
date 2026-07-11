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
        user: req.user.userId,
        gstNumber,
      });

    if (existingSupplier) {
      return res.status(400).json({
        message:
          "Supplier already exists",
      });
    }

    const supplierData = {
      user: req.user.userId,
      name,
      email,
      gstNumber,
      address,
    };

    if (typeof phone === "string" && phone.trim()) {
      supplierData.phone = phone;
    }

    const supplier =
      await Supplier.create(supplierData);

    res.status(201).json(supplier);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


const getSuppliers = async (req, res) => {
  try {

    const suppliers = await Supplier.find({
      user: req.user.userId,
    });

    res.status(200).json(suppliers);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


const getSupplierById = async (req, res) => {
  try {

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

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
    const {
      name,
      email,
      phone,
      gstNumber,
      address,
    } = req.body;

    const updateData = {
      $set: {
        name,
        email,
        gstNumber,
        address,
      },
    };

    if (typeof phone === "string" && phone.trim()) {
      updateData.$set.phone = phone;
    } else {
      updateData.$unset = {
        phone: 1,
      };
    }

    const supplier = await Supplier.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
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

    const supplier = await Supplier.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

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
