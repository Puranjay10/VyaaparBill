const Customer = require("../models/Customer");
const asyncHandler = require("../utils/asyncHandler");

// Create Customer
const createCustomer = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
  } = req.body;

  const customerData = {
    user: req.user.userId,
    name,
    phone,
    address,
  };

  if (typeof email === "string" && email.trim()) {
    customerData.email = email;
  }

  const customer = await Customer.create(customerData);

  res.status(201).json(customer);
});


// Get All Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      user: req.user.userId,
    });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// Get Customer By ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
    } = req.body;

    const updateData = {
      $set: {
        name,
        phone,
        address,
      },
    };

    if (typeof email === "string" && email.trim()) {
      updateData.$set.email = email;
    } else {
      updateData.$unset = {
        email: 1,
      };
    }

    const customer = await Customer.findOneAndUpdate(
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

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};