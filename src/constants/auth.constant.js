export const cookieOption = {
    httpOnly: true, // always true ✅
    signed: true,
    secure: process.env.NODE_ENV === "production"
};

export const riskLevel = ["verylow", "low", "mid", "high", "veryhigh"];

export const twoFaMethods =["EMAIL", "TOTP", "BACKUPCODE"]
export const loginMethods = [
    "passkey",
    "password",
    "session_approval",
    "securty_key"
];
