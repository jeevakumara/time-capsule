import nodemailer from 'nodemailer';
import dns from 'dns';
const Notification = require("../models/Notification");
const User = require("../models/User");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Intercept the connection and physically force an IPv4 resolution
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, (err, address, family) => {
            callback(err, address, family);
        });
    }
} as any);


const sendCapsuleAssignedNotification = async (capsule) => {
    try {
        const receiver = await User.findById(capsule.receiverId);
        if (!receiver) return;

        // Phase 5: capsule-specific deep link so the interviewer lands directly
        // on their capsule rather than the generic dashboard.
        const capsuleUrl = `${process.env.CLIENT_URL}/interviewer/capsules/${capsule._id}`;

        const title = "New Time Capsule Assigned";
        const message = `You have been assigned a new capsule: "${capsule.title}".
Unlock time: ${capsule.unlockTime.toLocaleString()}.
Open your capsule directly: ${capsuleUrl}`;

        const htmlMessage = `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
                <h2 style="color:#4f46e5;margin-top:0;">?? New Time Capsule Assigned</h2>
                <p>Hello <strong>${receiver.name}</strong>,</p>
                <p>A new confidential capsule has been assigned to you:</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Title</td><td><strong>${capsule.title}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280;">Unlock time</td><td>${capsule.unlockTime.toLocaleString()}</td></tr>
                    ${capsule.expiryTime ? `<tr><td style="padding:6px 0;color:#6b7280;">Expires</td><td>${capsule.expiryTime.toLocaleString()}</td></tr>` : ""}
                </table>
                <p>You must be at the designated location at or after the unlock time to access the document.</p>
                <a href="${capsuleUrl}"
                   style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-top:8px;">
                    Open My Capsule ?
                </a>
                <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
                    If the button above doesn't work, copy this URL into your browser:<br/>
                    <a href="${capsuleUrl}" style="color:#4f46e5;">${capsuleUrl}</a>
                </p>
            </div>
        `;

        // Save in-app notification
        await Notification.create({
            receiverId: receiver._id,
            capsuleId: capsule._id,
            title,
            message,
        });

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: receiver.email,
            subject: title,
            html: htmlMessage,
        });
    } catch (error) {
        console.error("Error sending notification:", error.message);
    }
};

module.exports = { sendCapsuleAssignedNotification };
