const express = require("express");
const customerValidator = require("../validators/customerValidator");
const validate = require("../middleware/validationMiddleware");

const router = express.Router();

const protect =
  require("../middleware/authMiddleware");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

router.post("/", protect,customerValidator,validate,createCustomer);

router.get("/", protect, getCustomers);

router.get("/:id", protect, getCustomerById);

router.put("/:id", protect, updateCustomer);

router.delete("/:id", protect, deleteCustomer);

module.exports = router;