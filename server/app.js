const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Time Capsule API is running" });
});

module.exports = app;