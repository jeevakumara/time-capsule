import type { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
    user?: any;
}

const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-passwordHash");
        if (!user || user.status !== "active") {
            return res.status(401).json({ success: false, message: "User not found or disabled" });
        }

        req.user = user;
    } catch (error: any) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    next();
};

const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Access denied for this role" });
        }
        next();
    };
};

module.exports = { protect, authorize };