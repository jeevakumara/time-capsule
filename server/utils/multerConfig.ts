import type { Request } from "express";
import type { FileFilterCallback } from "multer";

const multer = require("multer");

// All files are held in memory - no local disk writes.
const memStorage = multer.memoryStorage();

// --- Capsule PDF Upload ---
const pdfFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
};

const upload = multer({
    storage: memStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
});

// --- Avatar Image Upload ---
const avatarFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") cb(null, true);
    else cb(new Error("Only JPEG/PNG files are allowed"));
};

const uploadAvatar = multer({
    storage: memStorage,
    fileFilter: avatarFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { upload, uploadAvatar };