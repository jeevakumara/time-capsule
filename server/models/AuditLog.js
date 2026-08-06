const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        capsuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Capsule",
            required: true,
        },
        action: {
            type: String,
            enum: ["CREATE_CAPSULE", "UNLOCK_ATTEMPT", "DELETE_CAPSULE"],
            required: true,
        },
        result: {
            type: String,
            enum: ["SUCCESS", "FAILURE"],
            required: true,
        },
        reason: { type: String }, // Additional info for failures
    },
    { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

