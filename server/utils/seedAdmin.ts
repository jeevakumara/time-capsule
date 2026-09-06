const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const run = async () => {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@timecapsule.com";

    if (!adminPassword) {
        console.error("ERROR: SEED_ADMIN_PASSWORD environment variable is not set. Aborting.");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
        console.log("Admin already exists:", existing.email);
        process.exit(0);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
        name: "System Admin",
        email: adminEmail,
        role: "admin",
        status: "active",
        passwordHash,
    });

    console.log("Admin created:", admin.email);
    process.exit(0);
};

run();
