const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getRecentLogs } = require("../controllers/auditController");

const router = express.Router();

router.get("/", protect, authorize("admin", "hr"), getRecentLogs);

module.exports = router;