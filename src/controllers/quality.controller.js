// controllers/qualityController.js

const { Quality } = require("../models/product/quality");

// Create a new quality
exports.createQuality = async (req, res) => {
  try {
    const quality = new Quality(req.body);
    await quality.save();
    return res.success(quality);
  } catch (error) {
    return res.error(error);
  }
};

// Get all qualities
exports.getQualities = async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim(); // Safely extract and trim query
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, default is 10

    // Build query based on search or fetch all qualities
    const query = searchQuery
      ? { name: { $regex: searchQuery, $options: "i" } }
      : {};

    // Find total number of matching qualities
    const totalQualities = await Quality.countDocuments(query);

    // Fetch qualities with pagination
    const qualities = await Quality.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    if (!qualities.length) {
      return res.error({ message: "No qualities found", status: 404 });
    }

    // Meta information for pagination
    const meta = {
      currentPage: page,
      pageItems: qualities.length,
      totalItems: totalQualities,
      totalPages: Math.ceil(totalQualities / limit),
    };

    // Send success response with qualities and meta
    return res.success(qualities, meta);
  } catch (error) {
    console.error("Error fetching qualities:", error); // Log the error for debugging
    return res.error("Server error");
  }
};

// Get a single quality by ID
exports.getQualityById = async (req, res) => {
  try {
    const quality = await Quality.findById(req.params.id);
    if (!quality) {
      return res.error({ status: 404, message: "Quality not found" });
    }
    return res.success(quality);
  } catch (error) {
    return res.error(error);
  }
};

// Update a quality by ID
exports.updateQuality = async (req, res) => {
  try {
    const quality = await Quality.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quality) {
      return res.error({ status: 404, message: "Quality not found" });
    }
    return res.success(quality);
  } catch (error) {
    return res.error(error);
  }
};

// Delete a quality by ID
exports.deleteQuality = async (req, res) => {
  try {
    const quality = await Quality.findByIdAndDelete(req.params.id);
    if (!quality) {
      return res.error({ status: 404, message: "Quality not found" });
    }
    return res.success({ message: "Quality deleted successfully" });
  } catch (error) {
    return res.error(error);
  }
};
