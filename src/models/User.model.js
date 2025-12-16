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
    refreshToken: [
        {
            token: { type: String, required: true },

            ip: String,
            country: String,
            city: String,

            deviceId: String,
            browser: String,
            os: String,
            deviceType: String,
            deviceSize: String,
            deviceModel: String,
            timezone: String,

            fingerprint: String,
            version: { type: Number, default: 1 },

            loginContext: {
                twoFA: { type: Boolean, default: false },

                method: {
                    type: String,
                    enum: [
                        "password",
                        "email_otp",
                        "totp",
                        "backup_code",
                        "trusted_device",
                        "remembered_device"
                    ]
                },

                risk: {
                    type: String,
                    enum: ["verylow", "low", "mid", "high", "veryhigh"],
                    default: "low"
                }
            },

            createdAt: {
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
        loginMethods: {
            email: {
                type: Object,
                default: {
                    type: "EMAIL",
                    on: true
                }
            },
            totp: {
                type: Object,
                default: {
                    type: "TOTP",
                    on: false,
                    code: ""
                }
            },
            backupcode: {
                type: Object,
                default: {
                    type: "BACKUPCODE",
                    code: []
                }
            }
        }
    }
});

export default new mongoose.model("User", userSchema);
