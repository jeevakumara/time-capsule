import mongoose, { Document, Schema, Types } from "mongoose";
const { CAPSULE_STATUS } = require("../utils/constants");

export interface ICapsule extends Document {
    title: string;
    description?: string;
    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;
    encryptedFilePath: string;
    fileName: string;
    location: {
        type: string;
        coordinates: number[];
    };
    radiusMeters: number;
    unlockTime: Date;
    expiryTime?: Date;
    status: string;
    isUnlocked: boolean;
}

const capsuleSchema = new Schema<ICapsule>(
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

        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        },
        radiusMeters: { type: Number, default: 100 },

        unlockTime: { type: Date, required: true },
        expiryTime: { type: Date },

        status: {
            type: String,
            enum: Object.values(CAPSULE_STATUS),
            default: CAPSULE_STATUS.PENDING,
        },
        isUnlocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Capsule = mongoose.model<ICapsule>("Capsule", capsuleSchema);
module.exports = Capsule;