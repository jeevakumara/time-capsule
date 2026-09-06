const { Storage } = require("@google-cloud/storage");
const path = require("path");

if (!process.env.GCS_BUCKET_NAME) {
    console.warn("[GCS] WARNING: GCS_BUCKET_NAME is not set. File storage will fail.");
}

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || "");

/**
 * Upload an encrypted capsule Buffer to GCS.
 * Returns the GCS object key (e.g. "capsules/1234567890-filename.enc").
 */
const uploadEncryptedCapsule = (buffer: Buffer, originalName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const objectKey = `capsules/${unique}-${originalName}.enc`;
        const file = bucket.file(objectKey);

        const stream = file.createWriteStream({
            resumable: false,
            contentType: "application/octet-stream",
        });

        stream.on("error", reject);
        stream.on("finish", () => resolve(objectKey));
        stream.end(buffer);
    });
};

/**
 * Download a file from GCS and return it as a Buffer.
 */
const downloadFile = (objectKey: string): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
        try {
            const [contents] = await bucket.file(objectKey).download();
            resolve(contents as Buffer);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Delete a file from GCS. Silently succeeds if file does not exist.
 */
const deleteFile = async (objectKey: string): Promise<void> => {
    try {
        await bucket.file(objectKey).delete();
    } catch (error: any) {
        // 404 means already deleted — not an error for our purposes
        if (error.code !== 404) throw error;
    }
};

/**
 * Upload an avatar image Buffer to GCS with public read access.
 * Returns the public URL of the uploaded file.
 */
const uploadAvatar = (buffer: Buffer, originalName: string, mimetype: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(originalName) || ".jpg";
        const objectKey = `avatars/avatar-${unique}${ext}`;
        const file = bucket.file(objectKey);

        const stream = file.createWriteStream({
            resumable: false,
            contentType: mimetype,
            metadata: { cacheControl: "public, max-age=31536000" },
        });

        stream.on("error", reject);
        stream.on("finish", async () => {
            try {
                await file.makePublic();
                const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${objectKey}`;
                resolve(publicUrl);
            } catch (err) {
                reject(err);
            }
        });
        stream.end(buffer);
    });
};

/**
 * Delete an old avatar from GCS by parsing the object key from its public URL.
 * Silently ignores non-GCS paths (e.g. legacy local paths like /uploads/...).
 */
const deleteAvatar = async (imageUrl: string | null | undefined): Promise<void> => {
    if (!imageUrl) return;
    const prefix = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`;
    if (!imageUrl.startsWith(prefix)) return; // skip legacy local paths
    const objectKey = imageUrl.slice(prefix.length);
    await deleteFile(objectKey);
};

module.exports = { uploadEncryptedCapsule, downloadFile, deleteFile, uploadAvatar, deleteAvatar };
