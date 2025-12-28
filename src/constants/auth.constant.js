export const cookieOption = {
    httpOnly: true, // always true ✅
    signed: true,
    secure: process.env.NODE_ENV === "production"
};

export const riskLevel = ["verylow", "low", "mid", "high", "veryhigh"];

export const twoFaMethods = ["EMAIL", "TOTP", "BACKUPCODE"];
export const loginMethods = [
    "trusted_session",
    "passkey",
    "security_key",
    "password",
    "session_approval"
];

export const userRefreshTokenSchema = {
    token: { type: String, required: true },
    used: {
        type: Boolean,
        default: false
    },
    ip: String,
    country: String,
    ctxId: String,
    city: String,
    deviceId: String,
    browser: String,
    os: String,
    deviceType: String,
    deviceSize: String,
    deviceModel: String,
    timezone: String,
    fingerprint: String,
    deviceName: String,
    version: { type: Number, default: 1 },
    loginContext: {
        primary: {
            method: {
                type: String,
                enum: [...loginMethods],
                required: true
            },
            timestamp: {
                type: Date,
                default: new Date()
            }
        },

        mfa: {
            required: {
                type: Boolean,
                default: false
            },
            complete: {
                type: Boolean,
                default: false
            },
            methodsUsed: {
                type: String,
                enum: ["totp", "email_otp", "backup_code", "none"],
                default: "none"
            }
        },

        trust: {
            deviceTrusted: {
                type: Boolean,
                default: false
            },
            sessionLevel: {
                type: String,
                enum: [...riskLevel],
                default: "low"
            }
        }
    },

    createdAt: {
        type: Date,
        default: new Date()
    },
    lastActive: {
        type: Date,
        default: new Date()
    }
};
