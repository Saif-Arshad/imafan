const { User } = require("../models/user");

async function adminOnly(req, res, next) {
  const user = await User.findById(req.user.id);
  if (user.type === "admin") {
    next();
  } else {
    return res.error({
      status: 403,
      message: "Admins only",
    });
  }
}

module.exports = { adminOnly };
