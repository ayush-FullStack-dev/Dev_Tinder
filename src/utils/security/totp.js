import { totp } from "otplib";

export const verifyTotpCode = (code, secret) => {
    const isValid = totp.verify({
        token: code,
        secret,
        window: 1
    });

    return isValid
        ? { success: true, method: "totp" }
        : { success: false, message: "Invalid TOTP code", method: "totp" };
};
