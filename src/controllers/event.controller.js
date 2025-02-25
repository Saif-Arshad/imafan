const { Event } = require("../models/event.js");

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim(); // Safely extract and trim query
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, default is 10

    // Build query based on search or fetch all events
    const query = searchQuery
      ? { name: { $regex: searchQuery, $options: "i" } }
      : {};

    // Find the total number of matching events
    const totalItems = await Event.countDocuments(query);

    // Fetch the events with pagination
    const events = await Event.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    // If no events are found
    if (!events.length) {
      return res.error({ message: "No events found", status: 404 });

    }

    // Meta data for pagination
    const meta = {
      currentPage: page,
      pageItems: events.length,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };

    // Send success response with events and pagination meta
    return res.success(events, meta);
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.error("Server error");
  }
};

// Get a single event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update an event by ID
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Delete an event by ID
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    return res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
