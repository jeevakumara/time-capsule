const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const { bufferToDataUrl } = require("../utils/gcsService");

const generateTempPassword = () => crypto.randomBytes(4).toString("hex");

const createUser = async (req, res) => {
    try {
        const { name, email, employeeId, role } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ success: false, message: "Name, email, and role are required" });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Avatar stored as base64 data URL directly in MongoDB
        let profileImage = null;
        if (req.file) {
            profileImage = bufferToDataUrl(req.file.buffer, req.file.mimetype);
        }

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            employeeId,
            role,
            passwordHash,
            profileImage,
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            tempPassword,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const listUsers = async (req, res) => {
    try {
        const filter: { role?: string } = {};
        if (req.query.role) filter.role = req.query.role as string;

        const users = await User.find(filter).select("-passwordHash");
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-passwordHash");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select("-passwordHash");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isSelf = req.user._id.toString() === user._id.toString();
        const isAdmin = req.user.role === "admin";
        const isHrUpdatingInterviewer = req.user.role === "hr" && user.role === "interviewer";

        if (!isSelf && !isAdmin && !isHrUpdatingInterviewer) {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        if (role && role !== user.role && !isAdmin) {
            return res.status(403).json({ success: false, message: "Only admins can change roles" });
        }

        if (name) user.name = name;
        if (role && isAdmin) user.role = role;

        if (req.file) {
            // Replace old avatar with new base64 data URL
            user.profileImage = bufferToDataUrl(req.file.buffer, req.file.mimetype);
        }

        await user.save();

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                email: user.email,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (req.user.role === "hr" && user.role !== "interviewer") {
            return res.status(403).json({ success: false, message: "HR can only delete interviewers" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = { createUser, listUsers, getUserById, updateUserStatus, updateUser, deleteUser };
