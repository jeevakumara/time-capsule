const express = require("express");
const {
    createUser,
    listUsers,
    getUserById,
    updateUserStatus,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("admin", "hr"), createUser);
router.get("/", protect, authorize("admin", "hr"), listUsers);
router.get("/:id", protect, authorize("admin", "hr"), getUserById);
router.patch("/:id/status", protect, authorize("admin"), updateUserStatus);

module.exports = router;