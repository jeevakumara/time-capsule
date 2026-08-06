const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    getMyNotifications,
    markNotificationRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/me", protect, authorize("interviewer", "hr", "admin"), getMyNotifications);
router.patch("/:id/read", protect, authorize("interviewer", "hr", "admin"), markNotificationRead);

module.exports = router;