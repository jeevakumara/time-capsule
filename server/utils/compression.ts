/**
 * Gzip compression utilities using Node.js built-in zlib.
 *
 * IMPORTANT — pipeline order:
 *   Upload:  compress() ? encryptBuffer()  ? store in MongoDB
 *   Unlock:  decryptBuffer() ? decompress() ? stream to client
 *
 * Compression MUST happen before encryption because:
 *   - Encrypted data is pseudo-random and is incompressible.
 *   - Compressing plaintext first can yield 40–70% savings for text-heavy PDFs.
 *
 * Note: JPEG and PNG files are already internally compressed.
 * Applying gzip to them typically increases size, so we only compress PDFs.
 */

const zlib = require("zlib");
const { promisify } = require("util");

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

/**
 * Gzip-compress a Buffer at maximum compression level.
 * Returns the compressed Buffer.
 */
const compress = async (buffer: Buffer): Promise<Buffer> => {
    return await gzipAsync(buffer, { level: zlib.constants.Z_BEST_COMPRESSION });
};

/**
 * Gzip-decompress a Buffer produced by compress().
 * Returns the original plaintext Buffer.
 */
const decompress = async (buffer: Buffer): Promise<Buffer> => {
    return await gunzipAsync(buffer);
};

module.exports = { compress, decompress };
