/**
 * MongoDB-backed file storage helpers.
 *
 * Encrypted capsule PDFs and avatar images are stored directly in MongoDB
 * documents as Buffer / base64 strings — no external file storage service needed.
 *
 * This module exists as a thin adapter so the rest of the codebase has a
 * consistent storage abstraction that can be swapped later if needed.
 */

/**
 * Convert an image Buffer to a base64 data URL for storage in the User document.
 */
const bufferToDataUrl = (buffer: Buffer, mimetype: string): string => {
    return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

module.exports = { bufferToDataUrl };
