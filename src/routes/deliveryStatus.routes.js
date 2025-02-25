const orderController = require("../controllers/order.controller");
const express = require("express");

const router = express.Router();


// Get non Deliver orders
router.get("/not-delivered", orderController.getNotDeliveredOrders);

module.exports = router;
