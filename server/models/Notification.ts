import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotification extends Document {
    receiverId: Types.ObjectId;
    capsuleId: Types.ObjectId;
    message: string;
    title: string;
    status: string;
}

const notificationSchema = new Schema<INotification>(
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

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
module.exports = Notification;