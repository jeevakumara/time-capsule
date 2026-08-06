const fs = require("fs");
const path = require("path");
const Capsule = require("../models/Capsule");
const { encryptFile } = require("../utils/encryption");

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

        await new Promise((resolve, reject) => {
            try {
                encryptFile(originalPath, encryptedPath);
                resolve();
            } catch (err) {
                reject(err);
            }
        });

        fs.unlinkSync(originalPath); // delete plain file

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
        const capsules = await Capsule.find({ receiverId: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, capsules });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching assigned capsules",
            error: error.message,
        });
    }
};
const unlockCapsule = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const capsuleId = req.params.id;

        if (!latitude || !longitude) {
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

        // Identity check
        if (String(capsule.receiverId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not the intended receiver",
            });
        }

        // Time check
        const now = new Date();
        if (now < capsule.unlockTime) {
            return res.status(403).json({
                success: false,
                message: "Unlock time has not been reached yet",
            });
        }
        if (capsule.expiryTime && now > capsule.expiryTime) {
            return res.status(403).json({
                success: false,
                message: "Capsule has expired",
            });
        }

        // Location check
        const distance = haversineDistanceMeters(
            capsule.latitude,
            capsule.longitude,
            Number(latitude),
            Number(longitude)
        );

        if (distance > capsule.radiusMeters) {
            return res.status(403).json({
                success: false,
                message: `You are outside the allowed location. Distance: ${Math.round(distance)}m`,
            });
        }

        // For Phase 4, just mark unlocked (decryption will be handled in the next phase)
        capsule.status = "unlocked";
        await capsule.save();

        res.status(200).json({
            success: true,
            message: "Capsule unlocked successfully. (File viewing will be implemented in the next phase.)",
        });
    } catch (error) {
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