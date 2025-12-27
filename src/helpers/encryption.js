import crypto from "crypto";

const ALGO = "aes-256-gcm";

const KEY = Buffer.from(process.env.BACKUP_CODE_KEY, "hex");

export function encryptData(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final()
    ]);

    return {
        iv: iv.toString("hex"),
        content: encrypted.toString("hex"),
        tag: cipher.getAuthTag().toString("hex")
    };
}

export const decryptData = (iv, content, tag) => {
    const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(content, "hex")),
        decipher.final()
    ]);

    return decrypted.toString("utf8");
};
