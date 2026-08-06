const fs = require("fs");
const path = require("path");
const Capsule = require("../models/Capsule");
const { encryptFile } = require("../utils/encryption");

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

module.exports = { createCapsule, listCapsulesBySender };