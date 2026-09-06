const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

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
app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Time Capsule API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/capsules", capsuleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);

module.exports = app;
