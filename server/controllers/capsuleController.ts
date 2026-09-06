const Capsule = require("../models/Capsule");
const { encryptBuffer, decryptBuffer } = require("../utils/encryption");
const { uploadEncryptedCapsule, downloadFile, deleteFile } = require("../utils/gcsService");
const { GeoSpatialService } = require("../utils/distance");
const { sendCapsuleAssignedNotification } = require("../services/notificationService");
const { addAuditLog } = require("../services/auditService");
const { validateTimeLock } = require("../utils/securityChecks");
const { AppError, SecurityError } = require("../utils/errors");

// HR / Admin: create a new capsule
const createCapsule = async (req, res) => {
    try {
        const {
            title,
            description,
            receiverId,
            latitude,
            longitude,
            radiusMeters,
            unlockTime,
            expiryTime,
        } = req.body;

        if (!title || !receiverId || !latitude || !longitude || !unlockTime) {
            return res.status(400).json({
                success: false,
                message: "Title, receiver, location, and unlock time are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Confidential PDF file is required",
            });
        }

        // Encrypt the in-memory PDF buffer, then stream to GCS — no disk I/O
        const encryptedBuffer = encryptBuffer(req.file.buffer);
        const gcsObjectKey = await uploadEncryptedCapsule(encryptedBuffer, req.file.originalname);

        const capsule = await Capsule.create({
            title,
            description,
            senderId: req.user._id,
            receiverId,
            encryptedFilePath: gcsObjectKey, // now stores "capsules/<key>.enc"
            fileName: req.file.originalname,
            location: {
                type: "Point",
                coordinates: [Number(longitude), Number(latitude)],
            },
            radiusMeters: radiusMeters ? Number(radiusMeters) : 100,
            unlockTime: new Date(unlockTime),
            expiryTime: expiryTime ? new Date(expiryTime) : undefined,
        });

        await addAuditLog({
            userId: req.user._id,
            capsuleId: capsule._id,
            action: "CREATE_CAPSULE",
            result: "SUCCESS",
            reason: "Capsule created, encrypted, and uploaded to GCS",
        });

        await sendCapsuleAssignedNotification(capsule);

        res.status(201).json({
            success: true,
            message: "Capsule created successfully",
            capsule,
        });
    } catch (error) {
        console.error("Error creating capsule:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating capsule",
            error: error.message,
        });
    }
};

// HR / Admin: list capsules created by this sender
const listCapsulesBySender = async (req, res) => {
    try {
        const capsules = await Capsule.find({ senderId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, capsules });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching capsules",
            error: error.message,
        });
    }
};

// Interviewer: list capsules assigned to this receiver
const listCapsulesAssignedToReceiver = async (req, res) => {
    try {
        const capsules = await Capsule.find({ receiverId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, capsules });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching assigned capsules",
            error: error.message,
        });
    }
};

// Interviewer: secure unlock (identity + status + time + location + decryption)
const unlockCapsule = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const capsuleId = req.params.id;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }

        const capsule = await Capsule.findById(capsuleId);
        if (!capsule) {
            return res.status(404).json({ success: false, message: "Capsule not found" });
        }

        // Layer 1: Identity
        const isAuthorizedUser = String(capsule.receiverId) === String(req.user._id);
        if (!isAuthorizedUser) {
            await addAuditLog({
                userId: req.user._id,
                capsuleId: capsule._id,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: "User is not the intended receiver",
            });
            return res.status(403).json({
                success: false,
                message: "You are not the intended receiver of this capsule",
            });
        }

        // Layer 2: Status
        if (capsule.status === "expired") {
            await addAuditLog({
                userId: req.user._id,
                capsuleId: capsule._id,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: "Capsule expired",
            });
            return res.status(403).json({ success: false, message: "This capsule has expired" });
        }

        // Layer 3: Time (server-side, UTC)
        const [isTimeValid, timeErrorMessage] = validateTimeLock(capsule.unlockTime, capsule.expiryTime);
        if (!isTimeValid) {
            if (timeErrorMessage === "Capsule has expired.") {
                capsule.status = "expired";
                await capsule.save();
            }
            throw new SecurityError(timeErrorMessage);
        }

        // Layer 4: Location (Haversine)
        const capsuleLat = capsule.location?.coordinates[1];
        const capsuleLng = capsule.location?.coordinates[0];
        const distance = GeoSpatialService.calculateHaversineDistance(
            capsuleLat,
            capsuleLng,
            Number(latitude),
            Number(longitude)
        );
        const isWithinGeofence = distance <= capsule.radiusMeters;

        if (!isWithinGeofence) {
            await addAuditLog({
                userId: req.user._id,
                capsuleId: capsule._id,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: `Outside allowed radius. Distance=${Math.round(distance)}m`,
            });
            return res.status(403).json({
                success: false,
                message: `You are outside the allowed location. Distance: ${Math.round(distance)}m (allowed: ${capsule.radiusMeters}m)`,
            });
        }

        // Layer 5: Download from GCS + Layer 6: Decrypt
        const encryptedBuffer = await downloadFile(capsule.encryptedFilePath);
        const decryptedBuffer = decryptBuffer(encryptedBuffer);

        capsule.status = "unlocked";
        capsule.isUnlocked = true;
        await capsule.save();

        await addAuditLog({
            userId: req.user._id,
            capsuleId: capsule._id,
            action: "UNLOCK_ATTEMPT",
            result: "SUCCESS",
            reason: "All checks passed, file downloaded from GCS and decrypted",
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${capsule.fileName}"`,
            "Content-Length": decryptedBuffer.length,
        });
        return res.status(200).send(decryptedBuffer);

    } catch (error) {
        console.error("unlockCapsule error:", error);

        try {
            await addAuditLog({
                userId: req.user?._id,
                capsuleId: req.params?.id || null,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: error.message,
            });
        } catch (e) {
            console.error("Error writing audit log:", e.message);
        }

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.name,
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while unlocking capsule",
            error: error.message,
        });
    }
};

// HR / Admin: delete a capsule + its GCS file
const deleteCapsule = async (req, res) => {
    try {
        const capsuleId = req.params.id;
        const capsule = await Capsule.findById(capsuleId);

        if (!capsule) {
            return res.status(404).json({ success: false, message: "Capsule not found" });
        }

        if (String(capsule.senderId) !== String(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this capsule",
            });
        }

        // Delete encrypted file from GCS (silent if already missing)
        await deleteFile(capsule.encryptedFilePath);

        await Capsule.findByIdAndDelete(capsuleId);

        const Notification = require("../models/Notification");
        await Notification.deleteMany({ capsuleId });

        await addAuditLog({
            userId: req.user._id,
            capsuleId: capsule._id,
            action: "DELETE_CAPSULE",
            result: "SUCCESS",
            reason: "Capsule and GCS file deleted successfully",
        });

        res.status(200).json({ success: true, message: "Capsule deleted successfully" });
    } catch (error) {
        console.error("Error deleting capsule:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting capsule",
            error: error.message,
        });
    }
};

module.exports = {
    createCapsule,
    listCapsulesBySender,
    listCapsulesAssignedToReceiver,
    unlockCapsule,
    deleteCapsule,
};
