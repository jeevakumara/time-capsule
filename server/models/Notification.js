const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        capsuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Capsule",
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);