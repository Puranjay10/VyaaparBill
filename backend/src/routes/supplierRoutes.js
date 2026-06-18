const express = require("express");

const router = express.Router();

const protect =
  require("../middleware/authMiddleware");

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

router.post("/", protect, createSupplier);

router.get("/", protect, getSuppliers);

router.get("/:id", protect, getSupplierById);

router.put("/:id", protect, updateSupplier);

router.delete("/:id", protect, deleteSupplier);

module.exports = router;