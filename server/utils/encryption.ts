const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

const getKey = (): Buffer => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || Buffer.from(key, "utf8").length !== 32) {
        throw new Error("ENCRYPTION_KEY must be set and exactly 32 bytes long");
    }
    return Buffer.from(key, "utf8");
};

/**
 * Encrypts a plain Buffer using AES-256-CBC.
 * The 16-byte IV is prepended to the returned Buffer so it can be recovered on decryption.
 * Format: [ IV (16 bytes) ][ Ciphertext ]
 */
const encryptBuffer = (plainBuffer: Buffer): Buffer => {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]); // IV prepended
};

/**
 * Decrypts an encrypted Buffer produced by encryptBuffer.
 * Extracts the IV from the first 16 bytes, then decrypts the remainder.
 */
const decryptBuffer = (encryptedBuffer: Buffer): Buffer => {
    const key = getKey();
    const iv = encryptedBuffer.subarray(0, 16);
    const ciphertext = encryptedBuffer.subarray(16);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

module.exports = { encryptBuffer, decryptBuffer };
