import type { Request, Response } from "express";

interface AuthRequest extends Request {
    user?: any;
}

const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.status !== "active") {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const getMe = async (req: AuthRequest, res: Response) => {
    res.status(200).json({ 
        success: true, 
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            profileImage: req.user.profileImage,
        }
    });
};

module.exports = { login, getMe };