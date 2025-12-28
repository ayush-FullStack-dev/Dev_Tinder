import { authenticator } from "otplib";

export const verifyTotpCode = (code, secret) => {
    const isValid = authenticator.verify({
        token: code,
        secret,
        window: 1
    });

    
    return isValid
        ? { success: true, method: "totp" }
        : { success: false, message: "Invalid TOTP code", method: "totp" };
};
