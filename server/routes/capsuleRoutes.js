const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../utils/multerConfig");
const { createCapsule, listCapsulesBySender } = require("../controllers/capsuleController");

const router = express.Router();

// HR / admin create capsule
router.post(
    "/",
    protect,
    authorize("hr", "admin"),
    upload.single("file"),
    createCapsule
);

// HR / admin list capsules they created
router.get(
    "/my",
    protect,
    authorize("hr", "admin"),
    listCapsulesBySender
);

module.exports = router;