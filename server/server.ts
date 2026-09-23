const http = require("http");
const fs = require("fs/promises");
const path = require("path");

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}
const app = require("./app");

// Startup environment validation
if (process.env.ENCRYPTION_KEY && Buffer.from(process.env.ENCRYPTION_KEY, "utf8").length !== 32) {
    console.warn("⚠️  WARNING: ENCRYPTION_KEY is not exactly 32 bytes. AES-256-CBC will fail.");
}

const PORT = process.env.PORT || 5000;

const logFile = path.join(__dirname, 'startup.log');
const logMessage = `Server booted at ${new Date().toISOString()}\n`;

fs.appendFile(logFile, logMessage)
    .then(() => console.log("Startup logged to filesystem using native fs."))
    .catch((err: unknown) => console.error("Failed to write startup log:", err));

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// -- Unit 4: Cron-style background task (native setInterval, no external packages) --
// Automatically marks capsules as 'expired' once their expiryTime has passed.
const EXPIRY_CHECK_INTERVAL_MS = 60 * 1000; // every 60 seconds

setInterval(async () => {
    try {
        const Capsule = require("./models/Capsule");
        const result = await Capsule.updateMany(
            { expiryTime: { $lt: new Date() }, status: { $ne: "expired" } },
            { $set: { status: "expired" } }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Cron] Auto-expired ${result.modifiedCount} capsule(s).`);
        }
    } catch (err: any) {
        console.error("[Cron] Capsule expiry check failed:", err.message);
    }
}, EXPIRY_CHECK_INTERVAL_MS);

console.log("[Cron] Capsule auto-expiry task started (60s interval).");
