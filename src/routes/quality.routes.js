// routes/qualityRoutes.js

const express = require("express");
const router = express.Router();
const qualityController = require("../controllers/quality.controller");

// Create a new quality
router.post("/", qualityController.createQuality);

// Get all 
router.get("/", qualityController.getQualities);

// Get a quality by ID
router.get("/:id", qualityController.getQualityById);

// Update a quality by ID
router.put("/:id", qualityController.updateQuality);

// Delete a quality by ID
router.delete("/:id", qualityController.deleteQuality);

module.exports = router;
