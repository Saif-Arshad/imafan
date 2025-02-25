const { Order } = require("../models/order");

exports.getStats = async (req, res) => {
  try {
    /** Total Sales Revenue */
    const totalSalesRevenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);
    const totalSalesRevenue =
      totalSalesRevenueResult.length > 0
        ? totalSalesRevenueResult[0].totalRevenue
        : 0;

    /** Number of Orders */
    const numberOfOrders = await Order.countDocuments();

    /** Average Order Value */
    const averageOrderValueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);
    const averageOrderValue =
      averageOrderValueResult.length > 0
        ? averageOrderValueResult[0].averageOrderValue
        : 0;

    /** Top Selling Products */
    const topSellingProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.price"],
            },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          phoneModel: "$productDetails.phoneModel",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    /** Sales by Brand */
    const salesByBrand = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.phoneBrand",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.price"],
            },
          },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: "$brandDetails" },
      {
        $project: {
          _id: 0,
          brandId: "$_id",
          brandName: "$brandDetails.name",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    /** Sales by Quality */
    const salesByQuality = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.quality",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.price"],
            },
          },
        },
      },
      {
        $lookup: {
          from: "qualities",
          localField: "_id",
          foreignField: "_id",
          as: "qualityDetails",
        },
      },
      { $unwind: "$qualityDetails" },
      {
        $project: {
          _id: 0,
          qualityId: "$_id",
          qualityName: "$qualityDetails.name",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    /** Orders Over Time (Last 30 Days) */
    const ordersOverTime = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$orderDate" },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /** Top Sellers */
    const topSellers = await Order.aggregate([
      {
        $group: {
          _id: "$seller",
          totalSales: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: "$sellerDetails" },
      {
        $project: {
          _id: 0,
          sellerId: "$_id",
          sellerName: "$sellerDetails.full_name",
          totalSales: 1,
          totalOrders: 1,
        },
      },
    ]);

    /** Orders by Status */
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);

    /** Assemble All Stats */
    const stats = {
      totalSalesRevenue,
      numberOfOrders,
      averageOrderValue,
      topSellingProducts,
      salesByBrand,
      salesByQuality,
      ordersOverTime,
      topSellers,
      ordersByStatus,
    };

    res.success(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.error({ message: "Error fetching stats", error });
  }
};
