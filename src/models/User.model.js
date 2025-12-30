import mongoose from "mongoose";

import { userRefreshTokenSchema } from "../constants/auth.constant.js";

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
    loginMethods: {
        passkeys: {
            enabled: {
                type: Boolean,
                default: false
            },
            keys: [
                {
                    credentialId: String,
                    publicKey: String,
                    counter: Number,
                    transports: [String],
                    name: String,
                    platform: String,
                    deviceType: String,
                    browser: String,
                    addedAt: {
                        type: Date,
                        default: () => new Date()
                    },
                    lastUsedAt: {
                        type: Date,
                        default: null
                    }
                }
            ],
            createdAt: {
                type: Date,
                default: () => new Date()
            }
        }
    },

    trustedDevices: [
        {
            deviceIdHash: {
                type: String,
                required: true,
                index: true
            },
            name: String,
            country: String,
            model: String,
            location: String,
            trustScore: Number,
            platform: {
                type: String,
                enum: ["web", "android", "ios"],
                default: "web"
            },
            createdAt: {
                type: Date,
                default: () => new Date()
            }
        }
    ],
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
                default: () => new Date()
            },
            action: {
                type: String,
                enum: ["logout", "logout-all", "session-revoke"]
            }
        }
    ],

    refreshToken: [userRefreshTokenSchema],
    twoFA: {
        enabled: {
            type: Boolean,
            default: false
        },
        tokenInfo: [userRefreshTokenSchema],
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
                            default: () => new Date()
                        },
                        lastUsedAt: {
                            type: Date,
                            default: null
                        }
                    }
                ],

                createdAt: { type: Date, default: () => new Date() }
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
                createdAt: { type: Date, default: () => new Date() },
                lastUsedAt: { type: Date, default: null }
            },
            backupCodes: {
                type: {
                    type: String,
                    enum: ["BACKUPCODE"],
                    default: "BACKUPCODE"
                },
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
                createdAt: { type: Date, default: () => new Date() },
                lastUsedAt: { type: Date, default: null }
            }
        }
    }
});

export default new mongoose.model("User", userSchema);
