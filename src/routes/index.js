const { Router } = require("express");
const router = Router();
const orderController = require("../controllers/order.controller");
const testRuleRouter = require("./test.routes.js");
const eventRouter = require("./event.routes.js");
const productRouter = require("./product.routes.js");
const qualityRouter = require("./quality.routes.js");
const brandRouter = require("./brand.routes.js");
const orderRouter = require("./order.routes.js");
const deliveryRoute = require("./deliveryStatus.routes.js");
const userRouter = require("./user.routes.js");
const statsRouter = require("./stats.routes.js");
const { verifyUserToken } = require("../middlewares/jwt.js");
const { adminOnly } = require("../middlewares/admin.js");

router.use("/test", testRuleRouter);
router.use("/events", verifyUserToken, eventRouter);
router.use("/products", verifyUserToken, productRouter);
router.use("/qualities", verifyUserToken, adminOnly, qualityRouter);
router.use("/brands", verifyUserToken, adminOnly, brandRouter);
router.use("/orders", verifyUserToken, orderRouter);
router.use("/stats", verifyUserToken, statsRouter);
router.use("/", deliveryRoute);
router.use("/users", userRouter);

module.exports = router;
