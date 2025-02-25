// controllers/productController.js

const { Product } = require("../models/product");
const { Brand } = require("../models/product/brand");
const { Quality } = require("../models/product/quality");

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    return res.success(product);
  } catch (error) {
    return res.error(error);
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim(); // Safely extract and trim query
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, default is 10
    const quantityCheck = parseInt(req.query.quantityCheck) || 10; // Items per page, default is 10

    // Aggregation pipeline to handle search and pagination
    const pipeline = [];

    // Add lookup stages to populate `phoneBrand` and `quality` fields
    pipeline.push(
      {
        $lookup: {
          from: "brands", // Collection name for phoneBrand (make sure the name is correct)
          localField: "phoneBrand",
          foreignField: "_id",
          as: "phoneBrand",
        },
      },
      {
        $lookup: {
          from: "qualities", // Collection name for quality (make sure the name is correct)
          localField: "quality",
          foreignField: "_id",
          as: "quality",
        },
      },
      {
        $unwind: {
          path: "$phoneBrand",
          preserveNullAndEmptyArrays: true, // Allow null or missing phoneBrand
        },
      },
      {
        $unwind: {
          path: "$quality",
          preserveNullAndEmptyArrays: true, // Allow null or missing quality
        },
      }
    );

    // Match condition to search on populated fields
    if (searchQuery) {
      pipeline.push({
        $match: {
          $or: [
            { phoneModel: { $regex: searchQuery, $options: "i" } },
            { "phoneBrand.name": { $regex: searchQuery, $options: "i" } },
            { "quality.name": { $regex: searchQuery, $options: "i" } },
          ],
        },
      });
    }

    // Quantity check condition
    if (quantityCheck === true) {
      pipeline.push({
        $match: {
          quantity: { $gt: 0 }, // Ensure product quantity meets or exceeds quantityCheck
        },
      });
    }
    pipeline.push({ $sort: { createdAt: -1 } });
    // Add pagination stages
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    // Execute the aggregation pipeline
    const products = await Product.aggregate(pipeline);

    // Count total products matching the query (without pagination)
    const totalProductsPipeline = [
      {
        $match: searchQuery
          ? {
            $or: [
              { phoneModel: { $regex: searchQuery, $options: "i" } },
              { "phoneBrand.name": { $regex: searchQuery, $options: "i" } },
              { "quality.name": { $regex: searchQuery, $options: "i" } },
            ],
          }
          : {},
      },
      { $count: "total" },
    ];

    const totalProductsResult = await Product.aggregate(totalProductsPipeline);
    const totalProducts = totalProductsResult.length
      ? totalProductsResult[0].total
      : 0;

    // Check if products were found
    if (!products.length) {
      return res.error({ message: "No products found", status: 404 });
    }

    // Meta information for pagination
    const meta = {
      currentPage: page,
      pageItems: products.length,
      totalItems: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
    };

    // Send success response with products and meta
    return res.success(products, meta);
  } catch (error) {
    console.error("Error fetching products:", error); // Log the error for debugging
    return res.error("Failed to fetch products");
  }
};
exports.getAllProducts = async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "brands", // Collection name for phoneBrand (make sure the name is correct)
          localField: "phoneBrand",
          foreignField: "_id",
          as: "phoneBrand",
        },
      },
      {
        $lookup: {
          from: "qualities", // Collection name for quality (make sure the name is correct)
          localField: "quality",
          foreignField: "_id",
          as: "quality",
        },
      },
      {
        $unwind: {
          path: "$phoneBrand",
          preserveNullAndEmptyArrays: true, // Allow null or missing phoneBrand
        },
      },
      {
        $unwind: {
          path: "$quality",
          preserveNullAndEmptyArrays: true, // Allow null or missing quality
        },
      },
    ];

    // Execute the aggregation pipeline
    const products = await Product.aggregate(pipeline);

    // Check if products were found
    if (!products.length) {
      return res.error({ message: "No products found", status: 404 });
    }

    return res.success(products);
  } catch (error) {
    console.error("Error fetching products:", error); // Log the error for debugging
    return res.error("Failed to fetch products");
  }
};

exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    console.log("🚀 ~ Received products:", products);

    if (!Array.isArray(products)) {
      return res.status(400).json({
        message: "Invalid product data. 'products' must be an array."
      });
    }

    // Separate products into two groups:
    // 1. Products with an _id and isUpdated true (for update)
    const productsToUpdate = products.filter(
      (product) => product._id && (product.isUpdated === true || product.isUpdated === true)
    );

    // 2. Products without an _id (for creation)
    const productsToCreate = products.filter(
      (product) => !product._id
    );

    // Process products to update
    for (const product of productsToUpdate) {
      const { _id, phoneModel, phoneBrand, quality, quantity } = product;

      // Validate required fields
      if (!phoneModel || quantity == null || !phoneBrand || !quality) {
        return res.status(400).json({
          message:
            "Missing required fields: phoneModel, phoneBrand, quality, or quantity.",
          product,
        });
      }

      // Find the brand document (case-insensitive match)
      const brandDoc = await Brand.findOne({
        name: { $regex: `^${phoneBrand}$`, $options: "i" }
      });
      if (!brandDoc) {
        return res.status(400).json({
          message: `Brand "${phoneBrand}" does not exist.`,
          product,
        });
      }

      // Find the quality document (case-insensitive match)
      const qualityDoc = await Quality.findOne({
        name: { $regex: `^${quality}$`, $options: "i" }
      });
      if (!qualityDoc) {
        return res.status(400).json({
          message: `Quality "${quality}" does not exist.`,
          product,
        });
      }

      console.log("🚀 Updating product with _id:", _id);
      await Product.findByIdAndUpdate(
        _id,
        {
          phoneModel,
          quantity,
          phoneBrand: brandDoc._id,
          quality: qualityDoc._id,
        },
        { new: true }
      );
    }

    // Process products to create
    for (const product of productsToCreate) {
      const { phoneModel, phoneBrand, quality, quantity } = product;

      // Validate required fields
      if (!phoneModel || quantity == null || !phoneBrand || !quality) {
        return res.status(400).json({
          message:
            "Missing required fields: phoneModel, phoneBrand, quality, or quantity.",
          product,
        });
      }

      // Find the brand document (case-insensitive match)
      const brandDoc = await Brand.findOne({
        name: { $regex: `^${phoneBrand}$`, $options: "i" }
      });
      if (!brandDoc) {
        return res.status(400).json({
          message: `Brand "${phoneBrand}" does not exist.`,
          product,
        });
      }

      // Find the quality document (case-insensitive match)
      const qualityDoc = await Quality.findOne({
        name: { $regex: `^${quality}$`, $options: "i" }
      });
      if (!qualityDoc) {
        return res.status(400).json({
          message: `Quality "${quality}" does not exist.`,
          product,
        });
      }

      console.log("🚀 Creating new product");
      await Product.create({
        phoneModel,
        quantity,
        phoneBrand: brandDoc._id,
        quality: qualityDoc._id,
      });
    }

    res.status(200).json({ message: "Products imported successfully!" });
  } catch (error) {
    console.error("Error updating products:", error);
    res.status(500).json({
      message: "Failed to update products.",
      error: error.message,
    });
  }
};




// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("phoneBrand")
      .populate("quality");
    if (!product) {
      return res.error({ status: 404, message: "Product not found" });
    }
    return res.success(product);
  } catch (error) {
    return res.error(error);
  }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("phoneBrand")
      .populate("quality");
    if (!product) {
      return res.error({ status: 404, message: "Product not found" });
    }
    return res.success(product);
  } catch (error) {
    return res.error(error);
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.error({ status: 404, message: "Product not found" });
    }
    return res.success({ message: "Product deleted successfully" });
  } catch (error) {
    return res.error(error);
  }
};
