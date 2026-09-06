const multer = require("multer");

// All files are held in memory — no local disk writes.
// Buffers are passed to the controller via req.file.buffer
// and streamed directly to Google Cloud Storage.

const memStorage = multer.memoryStorage();

// --- Capsule PDF Upload ---
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({
    storage: memStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// --- Avatar Image Upload ---
const avatarFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") cb(null, true);
    else cb(new Error("Only JPEG/PNG files are allowed"), false);
};

const uploadAvatar = multer({
    storage: memStorage,
    fileFilter: avatarFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

module.exports = { upload, uploadAvatar };
