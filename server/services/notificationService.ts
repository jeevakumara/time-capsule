const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");
const User = require("../models/User");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendCapsuleAssignedNotification = async (capsule) => {
    try {
        const receiver = await User.findById(capsule.receiverId);
        if (!receiver) return;

        const title = "New Time Capsule Assigned";
        const message = `You have been assigned a new capsule: "${capsule.title}". 
Unlock time: ${capsule.unlockTime.toLocaleString()}. 
Please login to Time Capsule to view details.`;
        const htmlMessage = `
            <p>You have been assigned a new capsule: <strong>"${capsule.title}"</strong>.</p>
            <p>Unlock time: ${capsule.unlockTime.toLocaleString()}</p>
            <p><a href="${process.env.CLIENT_URL}/interviewer">Click here to go to your interviewer dashboard</a> to view details.</p>
        `;

        // Save notification record
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
            text: message,
            html: htmlMessage,
        });
    } catch (error) {
        console.error("Error sending notification:", error.message);
    }
};

module.exports = { sendCapsuleAssignedNotification };