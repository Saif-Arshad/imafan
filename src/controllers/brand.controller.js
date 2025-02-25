const { Brand } = require("../models/product/brand");

// Create a new brand
exports.createBrand = async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    return res.success(brand);
  } catch (error) {
    return res.error(error);
  }
};

// Get all brands
exports.getBrands = async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim(); // Safely extract and trim query
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, default is 10

    // Build query based on search or fetch all brands
    const query = searchQuery
      ? { name: { $regex: searchQuery, $options: "i" } }
      : {};

    // Find the total number of matching brands
    const totalItems = await Brand.countDocuments(query);

    // Fetch the brands with pagination
    const brands = await Brand.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    // If no brands are found
    if (!brands.length) {
      return res.error({ message: "No brands found", status: 404 });
    }

    // Meta data for pagination
    const meta = {
      currentPage: page,
      pageItems: brands.length,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };

    // Send success response with brands and pagination meta
    return res.success(brands, meta);
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.error("Server error");
  }
};

// Get a single brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.error({ status: 404, message: "Brand not found" });
    }
    return res.success(brand);
  } catch (error) {
    return res.error(error);
  }
};

// Update a brand by ID
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!brand) {
      return res.error({ status: 404, message: "Brand not found" });
    }
    return res.success(brand);
  } catch (error) {
    return res.error(error);
  }
};

// Delete a brand by ID
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.error({ status: 404, message: "Brand not found" });
    }
    return res.success({ message: "Brand deleted successfully" });
  } catch (error) {
    return res.error(error);
  }
};
