require("dotenv").config();
const app = require("./app");

// Startup environment validation
if (process.env.ENCRYPTION_KEY && Buffer.from(process.env.ENCRYPTION_KEY, "utf8").length !== 32) {
    console.warn("⚠️  WARNING: ENCRYPTION_KEY is not exactly 32 bytes. AES-256-CBC will fail.");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});