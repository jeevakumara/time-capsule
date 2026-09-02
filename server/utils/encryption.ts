const crypto = require("crypto");
const fs = require("fs");

const ALGORITHM = "aes-256-cbc";

const getKey = () => Buffer.from(process.env.ENCRYPTION_KEY, "utf8"); // must be 32 bytes

const encryptFile = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const key = getKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const input = fs.createReadStream(inputPath);
        const output = fs.createWriteStream(outputPath);

        output.write(iv); // store IV at the start of the encrypted file

        input.pipe(cipher).pipe(output);

        output.on("finish", resolve);
        output.on("error", reject);
        input.on("error", reject);
    });
};

const decryptFileToBuffer = (encryptedPath) => {
    return new Promise((resolve, reject) => {
        try {
            const key = getKey();
            const fileBuffer = fs.readFileSync(encryptedPath);

            const iv = fileBuffer.subarray(0, 16);
            const encryptedData = fileBuffer.subarray(16);

            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            const decrypted = Buffer.concat([
                decipher.update(encryptedData),
                decipher.final(),
            ]);

            resolve(decrypted);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { encryptFile, decryptFileToBuffer };