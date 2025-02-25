// routes/productRoutes.js

const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { adminOnly } = require("../middlewares/admin");

// Create a new product
router.post("/", productController.createProduct);

// Get all 
router.get("/", productController.getProducts);
router.get("/get-all", productController.getAllProducts);
router.post("/import", productController.importProducts);

// Get a product by ID
router.get("/:id", productController.getProductById);

// Update a product by ID
router.put("/:id", productController.updateProduct);

// Delete a product by ID
router.delete("/:id", adminOnly, productController.deleteProduct);

module.exports = router;
