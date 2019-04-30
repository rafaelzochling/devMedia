const express = require("express");
const router = express.Router();

// @Route   GET /api/profile
// @Desc    Test Route
// @Access  Public
router.get("/", (req, res) => res.send("Profile Route."));

module.exports = router;
