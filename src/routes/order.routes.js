// routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { adminOnly } = require("../middlewares/admin");

// Create a new order
router.post("/", orderController.createOrder);

// Get all orders
router.get("/", orderController.getOrders);
// router.post("/message", orderController.sendAlertMessage)

// Get printers
router.get("/printers", orderController.getPrinters);

// Get an order by ID
router.get("/:id", orderController.getOrderById);

// Get an order recipt by ID
router.get("/reciept/:id", orderController.generateReceiptOrder);

// Update an order by ID
router.put("/:id", orderController.updateOrder);

// Delete an order by ID
router.delete("/:id", adminOnly, orderController.deleteOrder);

module.exports = router;
