const crypto = require("crypto");
const fs = require("fs");

const ALGORITHM = "aes-256-cbc";

const getKeyAndIv = () => {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "utf8"); // 32 bytes
    const iv = crypto.randomBytes(16);
    return { key, iv };
};

const encryptFile = (inputPath, outputPath) => {
    const { key, iv } = getKeyAndIv();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    output.write(iv); // store IV at start

    input.pipe(cipher).pipe(output);
};

module.exports = { encryptFile };