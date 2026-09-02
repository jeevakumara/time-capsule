import mongoose, { Document, Schema, Types } from "mongoose";
const { AUDIT_ACTIONS } = require("../utils/constants");

export interface IAuditLog extends Document {
    userId: Types.ObjectId;
    capsuleId?: Types.ObjectId;
    action: string;
    result: string;
    reason?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
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
            enum: Object.values(AUDIT_ACTIONS),
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

const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
module.exports = AuditLog;
