const fs = require("fs");
const path = require("path");
const Capsule = require("../models/Capsule");
const { encryptFile, decryptFileToBuffer } = require("../utils/encryption");
const { haversineDistanceMeters } = require("../utils/distance");

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

        await encryptFile(originalPath, encryptedPath);
        fs.unlinkSync(originalPath); // remove plain file after encryption

        const capsule = await Capsule.create({
            title,
            description,
            senderId: req.user._id,
            receiverId,
            encryptedFilePath: encryptedPath,
            fileName: req.file.originalname,
            latitude: Number(latitude),
            longitude: Number(longitude),
            radiusMeters: radiusMeters ? Number(radiusMeters) : 100,
            unlockTime: new Date(unlockTime),
            expiryTime: expiryTime ? new Date(expiryTime) : undefined,
        });

        res.status(201).json({
            success: true,
            message: "Capsule created successfully",
            capsule,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error while creating capsule",
            error: error.message,
        });
    }
};

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

// Core secure unlock flow: identity + time + location + decryption
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
        if (String(capsule.receiverId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not the intended receiver of this capsule",
            });
        }

        if (capsule.status === "expired") {
            return res.status(403).json({
                success: false,
                message: "This capsule has expired",
            });
        }

        // Layer 2: Time check
        const now = new Date();
        if (now < capsule.unlockTime) {
            return res.status(403).json({
                success: false,
                message: `Unlock time not reached yet. Unlocks at ${capsule.unlockTime.toISOString()}`,
            });
        }
        if (capsule.expiryTime && now > capsule.expiryTime) {
            capsule.status = "expired";
            await capsule.save();
            return res.status(403).json({
                success: false,
                message: "This capsule has expired",
            });
        }

        // Layer 3: Location check
        const distance = haversineDistanceMeters(
            capsule.latitude,
            capsule.longitude,
            Number(latitude),
            Number(longitude)
        );

        if (distance > capsule.radiusMeters) {
            return res.status(403).json({
                success: false,
                message: `You are outside the allowed location. Distance: ${Math.round(
                    distance
                )}m (allowed: ${capsule.radiusMeters}m)`,
            });
        }

        // All checks passed — decrypt the file
        if (!fs.existsSync(capsule.encryptedFilePath)) {
            return res.status(500).json({
                success: false,
                message: "Encrypted file not found on server",
            });
        }

        const decryptedBuffer = await decryptFileToBuffer(capsule.encryptedFilePath);

        capsule.status = "unlocked";
        await capsule.save();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${capsule.fileName}"`,
            "Content-Length": decryptedBuffer.length,
        });

        return res.status(200).send(decryptedBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error while unlocking capsule",
            error: error.message,
        });
    }
};

module.exports = {
    createCapsule,
    listCapsulesBySender,
    listCapsulesAssignedToReceiver,
    unlockCapsule,
};