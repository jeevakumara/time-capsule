const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../utils/multerConfig");
const {
    createCapsule,
    listCapsulesBySender,
    listCapsulesAssignedToReceiver,
    unlockCapsule,
    deleteCapsule,
} = require("../controllers/capsuleController");

const router = express.Router();

// HR/Admin create capsule
router.post(
    "/",
    protect,
    authorize("hr", "admin"),
    upload.single("file"),
    createCapsule
);

// HR/Admin list their own capsules
router.get(
    "/my",
    protect,
    authorize("hr", "admin"),
    listCapsulesBySender
);

// Interviewer list assigned capsules
router.get(
    "/assigned/me",
    protect,
    authorize("interviewer"),
    listCapsulesAssignedToReceiver
);

// Interviewer unlock capsule with GPS + time
router.post(
    "/:id/unlock",
    protect,
    authorize("interviewer"),
    unlockCapsule
);

// HR/Admin delete capsule
router.delete(
    "/:id",
    protect,
    authorize("hr", "admin"),
    deleteCapsule
);

module.exports = router;