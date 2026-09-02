const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
        console.log("Admin already exists:", existing.email);
        process.exit();
    }

    const passwordHash = await bcrypt.hash("Admin@123", 10);
    const admin = await User.create({
        name: "System Admin",
        email: "admin@timecapsule.com",
        role: "admin",
        passwordHash,
    });

    console.log("Admin created:", admin.email, "Password: Admin@123");
    process.exit();
};

run();