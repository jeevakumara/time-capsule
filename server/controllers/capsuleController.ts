const fs = require("fs");
const path = require("path");
const Capsule = require("../models/Capsule");
const { encryptFile, decryptFileToBuffer } = require("../utils/encryption");
const { GeoSpatialService } = require("../utils/distance");
const { sendCapsuleAssignedNotification } = require("../services/notificationService");
const { addAuditLog } = require("../services/auditService");
const { validateTimeLock } = require("../utils/securityChecks");
const { AppError, SecurityError, ValidationError } = require("../utils/errors");

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

        const originalPath = req.file.path;
        const encryptedFileName = "enc-" + req.file.filename;
        const encryptedPath = path.join(path.dirname(originalPath), encryptedFileName);

        // Encrypt and delete original
        await encryptFile(originalPath, encryptedPath);
        fs.unlinkSync(originalPath);

        const capsule = await Capsule.create({
            title,
            description,
            senderId: req.user._id,
            receiverId,
            encryptedFilePath: encryptedPath,
            fileName: req.file.originalname,
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)]
            },
            radiusMeters: radiusMeters ? Number(radiusMeters) : 100,
            unlockTime: new Date(unlockTime),
            expiryTime: expiryTime ? new Date(expiryTime) : undefined,
        });

        // Audit: success
        await addAuditLog({
            userId: req.user._id,
            capsuleId: capsule._id,
            action: "CREATE_CAPSULE",
            result: "SUCCESS",
            reason: "Capsule created and encrypted successfully",
        });

        // Notify receiver (email + notification record)
        await sendCapsuleAssignedNotification(capsule);

        res.status(201).json({
            success: true,
            message: "Capsule created successfully",
            capsule,
        });
    } catch (error) {
        console.error(error);

        // Audit: failure (capsuleId may be null if creation failed early)
        try {
            await addAuditLog({
                userId: req.user?._id,
                capsuleId: null,
                action: "CREATE_CAPSULE",
                result: "FAILURE",
                reason: error.message,
            });
        } catch (e) {
            console.error("Error writing audit log for createCapsule:", e.message);
        }

        res.status(500).json({
            success: false,
            message: "Server error while creating capsule",
            error: error.message,
        });
    }
};

// HR / Admin: list capsules created by this user
const listCapsulesBySender = async (req, res) => {
    try {
        const capsules = await Capsule.find({ senderId: req.user._id })
            .populate("receiverId", "name email")
            .sort({ createdAt: -1 });

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
        const capsules = await Capsule.find({ receiverId: req.user._id }).sort({
            createdAt: -1,
        });
        res.status(200).json({ success: true, capsules });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching assigned capsules",
            error: error.message,
        });
    }
};

// Interviewer: secure unlock (identity + time + location + decryption)
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
            return res.status(404).json({
                success: false,
                message: "Capsule not found",
            });
        }

        // Layer 1: Identity check
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

        if (capsule.status === "expired") {
            await addAuditLog({
                userId: req.user._id,
                capsuleId: capsule._id,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: "Capsule expired",
            });

            return res.status(403).json({
                success: false,
                message: "This capsule has expired",
            });
        }

        // Layer 2: Time check
        const [isTimeValid, timeErrorMessage] = validateTimeLock(capsule.unlockTime, capsule.expiryTime);

        if (!isTimeValid) {
            if (timeErrorMessage === "Capsule has expired.") {
                capsule.status = "expired";
                await capsule.save();
            }

            throw new SecurityError(timeErrorMessage);
        }

        // Layer 3: Location check
        const capsuleLat = capsule.location?.coordinates[1] ?? capsule.latitude;
        const capsuleLng = capsule.location?.coordinates[0] ?? capsule.longitude;

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
                message: `You are outside the allowed location. Distance: ${Math.round(
                    distance
                )}m (allowed: ${capsule.radiusMeters}m)`,
            });
        }

        // All checks passed — decrypt the file
        if (!fs.existsSync(capsule.encryptedFilePath)) {
            await addAuditLog({
                userId: req.user._id,
                capsuleId: capsule._id,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: "Encrypted file missing on server",
            });

            return res.status(500).json({
                success: false,
                message: "Encrypted file not found on server",
            });
        }

        const decryptedBuffer = await decryptFileToBuffer(capsule.encryptedFilePath);

        capsule.status = "unlocked";
        capsule.isUnlocked = true;
        await capsule.save();

        await addAuditLog({
            userId: req.user._id,
            capsuleId: capsule._id,
            action: "UNLOCK_ATTEMPT",
            result: "SUCCESS",
            reason: "All checks passed and file decrypted",
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${capsule.fileName}"`,
            "Content-Length": decryptedBuffer.length,
        });

        return res.status(200).send(decryptedBuffer);
    } catch (error) {
        console.error(error);

        try {
            await addAuditLog({
                userId: req.user?._id,
                capsuleId: req.params?.id || null,
                action: "UNLOCK_ATTEMPT",
                result: "FAILURE",
                reason: error.message,
            });
        } catch (e) {
            console.error("Error writing audit log for unlockCapsule:", e.message);
        }

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ 
                success: false, 
                error: error.message,
                type: error.name
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while unlocking capsule",
            error: error.message,
        });
    }
};

// HR / Admin: delete a capsule
const deleteCapsule = async (req, res) => {
    try {
        const capsuleId = req.params.id;
        const capsule = await Capsule.findById(capsuleId);

        if (!capsule) {
            return res.status(404).json({
                success: false,
                message: "Capsule not found",
            });
        }

        // Only sender or admin can delete
        if (String(capsule.senderId) !== String(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this capsule",
            });
        }

        // Delete encrypted file from file system
        if (fs.existsSync(capsule.encryptedFilePath)) {
            fs.unlinkSync(capsule.encryptedFilePath);
        }

        // Delete the capsule from DB
        await Capsule.findByIdAndDelete(capsuleId);

        // Also delete any notifications associated with this capsule to avoid orphaned data
        const Notification = require("../models/Notification");
        await Notification.deleteMany({ capsuleId: capsuleId });

        await addAuditLog({
            userId: req.user._id,
            capsuleId: capsule._id,
            action: "DELETE_CAPSULE",
            result: "SUCCESS",
            reason: "Capsule deleted successfully",
        });

        res.status(200).json({
            success: true,
            message: "Capsule deleted successfully",
        });
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