const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        encryptedFilePath: { type: String, required: true },
        fileName: { type: String, required: true },

        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        radiusMeters: { type: Number, default: 100 },

        unlockTime: { type: Date, required: true },
        expiryTime: { type: Date },

        status: {
            type: String,
            enum: ["pending", "unlocked", "expired"],
            default: "pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Capsule", capsuleSchema);