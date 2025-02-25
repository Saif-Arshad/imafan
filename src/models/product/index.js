const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    phoneModel: {
      type: String,
      required: true,
    },
    phoneBrand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: false,
    },
    quality: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quality",
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = { Product };
