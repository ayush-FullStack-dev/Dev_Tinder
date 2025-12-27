import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        default: null
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "admin"]
    },
    age: {
        type: Number,
        default: 18,
        min: 15
    },

    gender: {
        type: String,
        default: "male",
        enum: ["female", "male", "transgender"]
    },
    picture: {
        type: String,
        default:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRs1fzJizYJbxmeZhwoQdq9ocGyT1dGjAhLq_ZCsJ56g&s=10"
    },
    passkeys: [Object],
    securityKeys: [
        {
            credentialId: Buffer,
            publicKey: Buffer,
            counter: Number,
            transports: [String],
            createdAt: Date
        }
    ],
    trustedSession: [],
    logout: [
        {
            reason: {
                type: String
            },
            id: {
                type: String
            },
            at: {
                type: Date,
                default: Date.now()
            },
            action: {
                type: String,
                enum: ["logout", "logout-all", "session-revoke"]
            }
        }
    ],
    refreshToken: [
        {
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
                        enum: [
                            "trusted_session",
                            "passkey",
                            "security_key",
                            "password",
                            "session_approval"
                        ],
                        required: true
                    },
                    timestamp: {
                        type: Date,
                        default: Date.now
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
                        enum: ["verylow", "low", "mid", "high", "veryhigh"],
                        default: "low"
                    }
                }
            },

            createdAt: {
                type: Date,
                default: Date.now
            },
            lastActive: {
                type: Date,
                default: Date.now
            }
        }
    ],
    twoFA: {
        enabled: {
            type: Boolean,
            default: false
        },
        twoFAMethods: {
            email: {
                type: {
                    type: String,
                    enum: ["EMAIL"],
                    default: "EMAIL"
                },
                enabled: {
                    type: Boolean,
                    default: false
                },
                primary: {
                    type: String
                },
                emails: [
                    {
                        value: {
                            type: String,
                            required: true
                        },
                        verified: {
                            type: Boolean,
                            default: false
                        },
                        primary: {
                            type: Boolean,
                            default: false
                        },
                        addedAt: {
                            type: Date,
                            default: Date.now()
                        },
                        lastUsedAt: {
                            type: Date,
                            default: null
                        }
                    }
                ],

                createdAt: { type: Date, default: Date.now() }
            },
            totp: {
                type: {
                    type: String,
                    enum: ["TOTP"],
                    default: "TOTP"
                },

                enabled: {
                    type: Boolean,
                    default: false
                },
                verified: {
                    type: Boolean,
                    default: false
                },
                secret: {
                    type: String,
                    default: null
                },
                createdAt: { type: Date, default: Date.now() },
                lastUsedAt: { type: Date, default: null }
            },
            backupCodes: {
                enabled: { type: Boolean, default: false },

                codes: [
                    {
                        iv: {
                            type: String,
                            required: true
                        },
                        content: {
                            type: String,
                            required: true
                        },
                        tag: {
                            type: String,
                            required: true
                        }
                    }
                ],
                renew: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now() },
                lastUsedAt: { type: Date, default: null }
            }
        }
    }
});

export default new mongoose.model("User", userSchema);
