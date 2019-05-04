const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function(req, res, next) {
  token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No Password - Access Denied!" });
  }

  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid Password!" });
  }
};
