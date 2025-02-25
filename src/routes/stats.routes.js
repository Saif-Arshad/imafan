
const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");

/** Route to Get All Stats */
router.get("/", statsController.getStats);

module.exports = router;
