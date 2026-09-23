const Notification = require("../models/Notification");
import { Request, Response } from "express";
import { TimeCapsuleAPI } from "../types/api.namespace";
const getMyNotifications = async (req: Request | any, res: Response<TimeCapsuleAPI.StandardResponse | TimeCapsuleAPI.ErrorResponse>) => {
    try {
        const notifications = await Notification.find({ receiverId: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message,
        } as TimeCapsuleAPI.ErrorResponse);
    }
};

const markNotificationRead = async (req: Request | any, res: Response<TimeCapsuleAPI.StandardResponse | TimeCapsuleAPI.ErrorResponse>) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, receiverId: req.user._id },
            { status: "read" },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, error: "Notification not found" } as TimeCapsuleAPI.ErrorResponse);
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: error.message,
        } as TimeCapsuleAPI.ErrorResponse);
    }
};

module.exports = { getMyNotifications, markNotificationRead };