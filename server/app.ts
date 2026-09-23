const express = require("express");
import type { Request, Response } from "express";
const cors = require("cors");
const dotenv = require("dotenv");
const os = require("os");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const capsuleRoutes = require("./routes/capsuleRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");

connectDB();

const app = express();

// -- Shared middleware ----------------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// NOTE: /uploads/avatars static route removed.
// Avatar images are now served directly from Google Cloud Storage public URLs.

// -- Routes --------------------------------------------------------------------
app.get("/api/health", (req: Request, res: Response) => {
    res.json({ success: true, message: "Time Capsule API is running" });
});

app.get("/api/system/diagnostics", (req: Request, res: Response) => {
    const systemInfo = {
        platform: os.platform(),
        architecture: os.arch(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpus: os.cpus().length,
    };

    const currentDirectory = __dirname;
    const resolvedPath = path.resolve(currentDirectory, '..', 'package.json');
    const parsedPath = path.parse(resolvedPath);

    res.json({
        success: true,
        system: systemInfo,
        pathing: parsedPath,
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/capsules", capsuleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);

module.exports = app;
