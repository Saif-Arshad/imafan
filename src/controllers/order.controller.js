const { Order, Customer } = require("../models/order");
const moment = require("moment");
const { User, UserToken } = require("../models/user");
const { Product } = require("../models/product");
const { generateReceipt } = require("../utils/generate-reciept");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const ptp = require("pdf-to-printer2");
const { sleep } = require("../utils/sleep");

// exports.createOrder = async (req, res) => {
//   try {
//     const { products, event, customer, orderDiscount } = req.body;
//     const printerName = req.query.printerName;

//     const newCustomer = new Customer(customer);
//     await newCustomer.save();

//     // Get details for each product
//     const productDetails = await Promise.all(
//       products.map(async (product) => {
//         const productData = await Product.findById(product.product);
//         let productPrice = parseFloat(product.price);
//         if (isNaN(productPrice)) {
//           productPrice = productData.price || 0;
//         }

//         // Check if there’s enough stock
//         if (productData.quantity < product.quantity) {
//           throw new Error(`Insufficient stock for ${productData.phoneModel}`);
//         }

//         return {
//           ...product,
//           name: productData.phoneModel,
//           price: productPrice,
//           quantity: product.quantity,
//         };
//       })
//     );

//     const productTotal = productDetails.reduce((acc, product) => {
//       return acc + product.price * product.quantity;
//     }, 0);
//     const discount = parseFloat(orderDiscount) || 0;

//     let totalAmount = productTotal - discount;
//     if (totalAmount < 0) totalAmount = 0;

//     const order = new Order({
//       event: event._id,
//       products: productDetails,
//       customer: newCustomer._id,
//       seller: req.user.id,
//       orderDiscount,
//     });
//     await order.save();
//     // Reduce stock quantities for each product
//     await Promise.all(
//       productDetails.map(async (product) => {
//         await Product.findByIdAndUpdate(
//           product.product,
//           { $inc: { quantity: -product.quantity } },
//           { new: true }
//         );
//       })
//     );
//     const populatedOrder = await Order.findById(order._id)
//       .populate({
//         path: "products.product",
//         populate: [
//           {
//             path: "phoneBrand",
//             model: "Brand",
//           },
//           {
//             path: "quality",
//             model: "Quality",
//           },
//         ],
//       })
//       .populate("event")
//       .populate("customer")
//       .populate("seller");
//     // printing start from here of order
//     await generateReceipt({
//       order: populatedOrder,
//       internal: true,
//       printerName,
//     });
//     await sleep(500);
//     await generateReceipt({ order: populatedOrder, printerName });

//     return res.success(populatedOrder);
//   } catch (error) {
//     console.log("🚀 ~ exports.createOrder= ~ error:", error);
//     return res
//       .status(500)
//       .json({ message: "Error creating order", error: error.message });
//   }
// };


exports.createOrder = async (req, res) => {
  try {
    const { products, event, customer, orderDiscount } = req.body;

    const newCustomer = new Customer(customer);
    await newCustomer.save();

    // Get details for each product
    const productDetails = await Promise.all(
      products.map(async (product) => {
        const productData = await Product.findById(product.product);
        let productPrice = parseFloat(product.price);
        if (isNaN(productPrice)) {
          productPrice = productData.price || 0;
        }

        // Check if there’s enough stock
        if (productData.quantity < product.quantity) {
          throw new Error(`Insufficient stock for ${productData.phoneModel}`);
        }

        return {
          ...product,
          name: productData.phoneModel,
          price: productPrice,
          quantity: product.quantity,
        };
      })
    );

    const productTotal = productDetails.reduce((acc, product) => {
      return acc + product.price * product.quantity;
    }, 0);
    const discount = parseFloat(orderDiscount) || 0;

    let totalAmount = productTotal - discount;
    if (totalAmount < 0) totalAmount = 0;

    const order = new Order({
      event: event._id,
      products: productDetails,
      customer: newCustomer._id,
      seller: req.user.id,
      orderDiscount,
    });
    await order.save();

    // Reduce stock quantities for each product
    await Promise.all(
      productDetails.map(async (product) => {
        await Product.findByIdAndUpdate(
          product.product,
          { $inc: { quantity: -product.quantity } },
          { new: true }
        );
      })
    );

    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: "products.product",
        populate: [
          { path: "phoneBrand", model: "Brand" },
          { path: "quality", model: "Quality" },
        ],
      })
      .populate("event")
      .populate("customer")
      .populate("seller");

    // Generate the customer copy PDF and capture its URL.
    // We no longer send it to the printer.
    const customerReceipt = await generateReceipt({
      order: populatedOrder,
      internal: false,
    });

    // Optionally, you can also generate the internal copy without sending its URL
     const internalReceipt = await generateReceipt({ order: populatedOrder, internal: true });

    return res.success({
      order: populatedOrder,
      receiptUrls: [internalReceipt, customerReceipt],
    });
  } catch (error) {
    console.log("🚀 ~ exports.createOrder= ~ error:", error);
    return res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};


exports.generateReceiptOrder = async (req, res) => {
  const orderId = req.params.id || 0;
  console.log("🚀 ~ exports.generateReceiptOrder= ~ orderId:", orderId)
  // const printerName = req.query.printerName; // No longer needed
  try {
    // Fetch the order by ID
    const order = await Order.findById(orderId)
    .populate("event")
    .populate({
      path: "products.product",
      populate: [
        { path: "phoneBrand", model: "Brand" },
        { path: "quality", model: "Quality" },
      ],
    })
    .populate("seller")
    .populate("customer");
    
    if (!order) {
      throw new Error("Order not found");
    }
    console.log("🚀 ~ exports.generateReceiptOrder= ~ order:", order)

     const customerReceipt = await generateReceipt({
       order: order,
       internal: false,
     });

     // Optionally, you can also generate the internal copy without sending its URL
     const internalReceipt = await generateReceipt({
       order: order,
       internal: true,
     });

     return res.success({
       order: order,
       receiptUrls: [internalReceipt, customerReceipt],
     });
  } catch (error) {
    console.log("🚀 ~ exports.generateReceiptOrder= ~ error:", error);
    return res.status(500).json({
      message: "Error generating receipt order",
      error: error.message,
    });
  }
};


// exports.generateReceiptOrder = async (req, res) => {
//   const orderId = req.params.id || 0;
//   const printerName = req.query.printerName;
//   try {
//     // Fetch the order by ID
//     const order = await Order.findById(orderId)
//       .populate("event")
//       .populate({
//         path: "products.product",
//         populate: [
//           {
//             path: "phoneBrand",
//             model: "Brand",
//           },
//           {
//             path: "quality",
//             model: "Quality",
//           },
//         ],
//       })
//       .populate("seller")
//       .populate("customer");

//     if (!order) {
//       throw new Error("Order not found");
//     }
//     await generateReceipt({ order, internal: false, printerName });
//     await sleep(500);
//     await generateReceipt({ order, internal: true, printerName });

//     res.success(order);
//   } catch (error) {
//     console.log("🚀 ~ exports.generateReceiptOrder= ~ error:", error);
//     return res.status(500).json({
//       message: "Error generateReceiptOrder",
//       error: error.message,
//     });
//   }
// };

exports.getPrinters = async (req, res) => {
  try {
    const printers = await ptp.getPrinters();
    res.success(printers);
  } catch (error) {
    console.log("🚀 ~ exports.getPrinters= ~ error:", error);
    return res.status(500).json({
      message: "Error getPrinters",
      error: error.message,
    });
  }
};

exports.getNotDeliveredOrders = async (req, res) => {
  // Set the start of today and the current time as the range
  const startOfToday = moment().startOf("day").toDate();
  const now = moment().toDate();

  try {
    const orders = await Order.find({
      status: { $ne: "delivered" },
      createdAt: { $gte: startOfToday, $lte: now }, // Fetch today's orders only
    })
      .populate("event")
      .populate("products.product")
      .populate("seller")
      .populate("customer");

    if (!orders.length) {
      return res.error({
        message: "No non-delivered orders found",
        status: 404,
      });
    }

    const filteredOrders = orders.map((order) => ({
      day_id: order.day_id,
      status: order.status,
    }));

    return res.success(filteredOrders);
  } catch (error) {
    console.error("Error fetching non-delivered orders:", error);
    return res.error("Failed to fetch non-delivered orders");
  }
};



// Get all orders
exports.getOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const searchQuery = req.query.query?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const currentUser = await User.findById(userId);
    const pipeline = [];

    pipeline.push(
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } }, // Unwind customer

      {
        $lookup: {
          from: "users", // Collection for sellers
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } } // Unwind seller
    );

    // Match condition to search on relevant fields
    if (searchQuery) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } }, // Search by customer name
            { status: { $regex: searchQuery, $options: "i" } }, // Search by order status
            { "seller.full_name": { $regex: searchQuery, $options: "i" } },
            { "customer.name": { $regex: searchQuery, $options: "i" } }, // Search by customer's name
            { "event.name": { $regex: searchQuery, $options: "i" } }, // Search by event name
            {
              "products.phoneModel.name": {
                $regex: searchQuery,
                $options: "i",
              },
            }, // Search by product name
          ],
        },
      });
    }
    if (currentUser && currentUser.type === "printer") {
      pipeline.push({
        $match: {
          status: { $in: ["in-process", "printing"] },
        },
      });
    }
    if (currentUser && currentUser.type === "presser") {
      pipeline.push({
        $match: {
          status: { $in: ["printing", "ready-to-go"] },
        },
      });
    }

    // Add pagination stages
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    // Execute the aggregation pipeline
    const orders = (await Order.aggregate(pipeline)).map((x) => {
      const updatedProducts = x.products.map((product) => {
        const matchingProductDetails = x.productDetails.find(
          (detail) => String(detail.id) === String(product.id)
        );

        return {
          ...product,
          productDetails: matchingProductDetails || null, // Assign the matching details or null if not found
        };
      });

      return {
        ...x, // Spread the original order data
        products: updatedProducts, // Update products array with matched details
      };
    });

    // Count total orders matching the query (without pagination)
    const totalOrdersPipeline = [
      {
        $match: searchQuery
          ? {
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { status: { $regex: searchQuery, $options: "i" } },
              { "customer.name": { $regex: searchQuery, $options: "i" } },
              { "event.name": { $regex: searchQuery, $options: "i" } },
              { "seller.full_name": { $regex: searchQuery, $options: "i" } },
              {
                "products.phoneModel.name": {
                  $regex: searchQuery,
                  $options: "i",
                },
              },
            ],
          }
          : {},
      },
      { $count: "total" },
    ];

    const totalOrdersResult = await Order.aggregate(totalOrdersPipeline);
    const totalOrders = totalOrdersResult.length
      ? totalOrdersResult[0].total
      : 0;

    // Check if orders were found
    if (!orders.length) {
      return res.error({ message: "No orders found", status: 404 });
    }

    // Meta information for pagination
    const meta = {
      currentPage: page,
      pageItems: orders.length,
      totalItems: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    };

    // Send success response with orders and meta
    return res.success(orders, meta);
  } catch (error) {
    console.error("Error fetching orders:", error); // Log the error for debugging
    return res.error("Failed to fetch orders");
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("event")
      .populate("product")
      .populate("seller");
    if (!order) {
      return res.error({ status: 404, message: "Order not found" });
    }
    return res.success(order);
  } catch (error) {
    return res.error(error);
  }
};

// Update an order by ID
exports.updateOrder = async (req, res) => {
  try {
    const data = req.body;
    console.log("🚀 ~ exports.updateOrder= ~ data:", data);

    // Calculate product total and discount
    const productTotal = data.products.reduce((acc, product) => {
      return acc + product.price * product.quantity;
    }, 0);

    const discount = parseFloat(data.orderDiscount) || 0;
    const totalPriceWithDiscount = productTotal - discount;
    const totalAmount = totalPriceWithDiscount < 0 ? 0 : totalPriceWithDiscount;

    // Update customer details if provided.
    // It's assumed that the customer field contains an _id (existing Customer) that can be updated.
    let updatedCustomer = null;
    if (data.customer && data.customer._id) {
      updatedCustomer = await Customer.findByIdAndUpdate(
        data.customer._id,
        data.customer,
        { new: true, runValidators: true }
      );
    }

    // Exclude the customer field from the order update data
    // so that we do not override the reference with nested data.
    const { customer, ...orderData } = data;

    // If customer was updated, ensure that the order reference points to the correct Customer document.
    if (updatedCustomer) {
      orderData.customer = updatedCustomer._id;
    }

    // Update order with recalculated totalAmount
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        ...orderData,
        totalAmount,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("event")
      .populate("products.product")
      .populate("seller")
      .populate("customer");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("🚀 ~ exports.updateOrder= ~ error:", error);
    return res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

// Delete an order by ID
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.error({ status: 404, message: "Order not found" });
    }
    return res.success({ message: "Order deleted successfully" });
  } catch (error) {
    return res.error(error);
  }
};
