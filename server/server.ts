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
