// routes/eventRoutes.js

const express = require("express");
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/event.controller.js");
const { adminOnly } = require("../middlewares/admin.js");

const router = express.Router();

// @route   POST /events
// @desc    Create a new event
router.post("/", adminOnly, createEvent);

// @route   GET /
// @desc    Get all events
router.get("/", getEvents);

// @route   GET //:id
// @desc    Get a single event by ID
router.get("/:id", adminOnly, getEventById);

// @route   PUT //:id
// @desc    Update an event by ID
router.put("/:id", adminOnly, updateEvent);

// @route   DELETE //:id
// @desc    Delete an event by ID
router.delete("/:id", adminOnly, deleteEvent);

module.exports = router;
