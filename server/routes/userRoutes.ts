const express = require("express");
const {
    createUser,
    listUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const { uploadAvatar } = require("../utils/multerConfig");

const router = express.Router();

router.post("/", protect, authorize("admin", "hr"), uploadAvatar.single('profileImage'), createUser);
router.get("/", protect, authorize("admin", "hr"), listUsers);
router.get("/:id", protect, authorize("admin", "hr"), getUserById);
router.patch("/:id/status", protect, authorize("admin"), updateUserStatus);
router.patch("/:id", protect, authorize("admin", "hr"), uploadAvatar.single('profileImage'), updateUser);
router.delete("/:id", protect, authorize("admin", "hr"), deleteUser);

module.exports = router;