const mongoose = require("mongoose");
const { User } = require("./user");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: false,
    },

    day_id: {
      type: String,
      required: false,
      unique: false,
      set: (v) => String(v).padStart(3, "0"),
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to the Product model
          required: true,
        },
        // customSize: {
        //   type: String,
        // },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    // customSize: {
    //   type: String,
    // },
    // quantity: {
    //   type: Number,
    //   required: true,
    //   min: 1,
    // },
    // price: {
    //   type: Number,
    //   required: true,
    //   min: 1,
    // },
    status: {
      type: String,
      enum: ["delivered", "in-process", "printing", "ready-to-go"],
      required: true,
      default: "in-process",
    },
    totalAmount: { type: Number, required: false }, // Total order amount
    receipt: { type: String, required: false },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the Product model
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderDiscount: {
      type: Number, // Discount on the entire order (percentage or fixed)
      default: 0, // Default is no discount
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.statics.generateDayId = async function (sellerId) {
  let sellerInitial = "X"; // Default initial in case seller is not found
  console.log(sellerId);

  // Fetch the seller to get the name
  try {
    const seller = await User.findById(sellerId).exec();
    if (seller && seller.full_name && typeof seller.full_name === "string") {
      sellerInitial = seller.full_name.charAt(0).toUpperCase(); // Get first letter of seller's full_name
    }
  } catch (err) {
    // Handle error if any
    console.error("Error fetching seller:", err);
  }

  // Get today's date range
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59
  );

  // Find the last order for this seller today
  const lastOrder = await this.findOne({
    seller: sellerId,
    orderDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    day_id: { $regex: `^${sellerInitial}` }, // day_id starting with sellerInitial
  })
    .sort({ orderDate: -1 })
    .exec();

  let nextSequenceNumber = "001";

  if (lastOrder && lastOrder.day_id) {
    // Extract the numeric part of the day_id and increment it
    const lastSequenceNumber = parseInt(lastOrder.day_id.slice(1), 10);
    nextSequenceNumber = String(lastSequenceNumber + 1).padStart(3, "0");
  }

  return `${sellerInitial}${nextSequenceNumber}`;
};

orderSchema.pre("save", async function (next) {
  // Ensure that the seller is available
  if (!this.seller) {
    return next(new Error("Seller is required to generate day_id"));
  }

  console.log(this.seller);
  // Generate day_id if not present
  if (!this.day_id) {
    this.day_id = await this.constructor.generateDayId(this.seller);
  } else {
    // Ensure day_id is properly formatted (initial + 3 digits)
    const seller = await User.findById(this.seller).exec();
    let sellerInitial = "X";
    if (seller && seller.full_name && typeof seller.full_name === "string") {
      sellerInitial = seller.full_name.charAt(0).toUpperCase();
    }
    const sequenceNumber = String(this.day_id).padStart(3, "0");
    this.day_id = `${sellerInitial}${sequenceNumber}`;
    // Ensure that `products` exists and is an array
  }

  if (Array.isArray(this.products) && this.products.length > 0) {
    // Calculate totalAmount
    const productTotal = this.products.reduce((acc, product) => {
      return acc + product.price * product.quantity;
    }, 0);

    const totalPriceWithDiscount = productTotal - this.orderDiscount;
    this.totalAmount = totalPriceWithDiscount < 0 ? 0 : totalPriceWithDiscount;
  }

  next();
});

// orderSchema.virtual("totalPrice").get(function () {
//   if (this.products.length === 0) return 0;
//   const productTotal = this.products.reduce((acc, product) => {
//     return acc + product.price * product.quantity;
//   }, 0);

//   const totalPriceWithDiscount = productTotal - this.orderDiscount;

//   return totalPriceWithDiscount < 0 ? 0 : totalPriceWithDiscount;
// });

// Virtual field to print receipts
// orderSchema.virtual("receipts").get(function () {
//   const productsDetails = this.products.map(product => {
//     return `Product: ${product.product}, Custom Size: ${product.customSize || "N/A"}, Quantity: ${product.quantity}, Price: ${product.price}`;
//   }).join("\n");

//   return {
//     clientReceipt: `Order Number: ${this.orderNumber}\n${productsDetails}\n`,
//     internalReceipt: `Order Number: ${this.orderNumber}\nEvent: ${this.event}\n${productsDetails}\n`,
//   };
// });

const Order = mongoose.model("Order", orderSchema);
const Customer = mongoose.model("Customer", customerSchema);

module.exports = { Order, Customer };
