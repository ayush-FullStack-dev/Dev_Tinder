import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        users: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Profile",
                    required: true
                }
            ],
            validate: {
                validator: v => Array.isArray(v) && v.length === 2,
                message: "Chat must have exactly 2 users"
            },
            index: true
        },

        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Match",
            required: true,
            unique: true,
            index: true
        },

        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active",
            index: true
        },

        lastMessage: {
            type: {
                type: String,
                enum: ["text", "image", "video", "file", "audio", "system"],
                default: null
            },
            text: { type: String, default: null },
            senderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Profile",
                default: null
            },
            messageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Profile",
                default: null
            },
            sentAt: { type: Date, default: null }
        },

        lastMessageAt: {
            type: Date,
            default: null,
            index: true
        },

        settings: {
            type: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Profile",
                        required: true
                    },

                    unreadCount: {
                        type: Number,
                        default: 0,
                        min: 0
                    },

                    muted: { type: Boolean, default: false },
                    pinned: { type: Boolean, default: false },
                    archived: { type: Boolean, default: false },

                    deletedAt: { type: Date, default: null }
                }
            ],
            validate: {
                validator: v => Array.isArray(v) && v.length === 2,
                message: "setting must have exactly 2 users"
            },
            required: true
        },
        deletedAt: {
            type: Date,
            default: null,
            expires: 0
        },

        e2ee: {
            enabled: { type: Boolean, default: false },
            algorithm: { type: String, default: "x25519+aes-gcm" },

            users: {
                type: [
                    {
                        userId: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "Profile",
                            required: true
                        },
                        identityKey: { type: String, default: null },
                        signedPreKeyId: { type: String, default: null }
                    }
                ],
                default: []
            }
        }
    },
    {
        timestamps: true
    }
);

// ✅ Ensure unique chat per match (best & simplest)
chatSchema.index({ matchId: 1 }, { unique: true });

// ✅ List chats fast
chatSchema.index({ users: 1, lastMessageAt: -1 });

export default mongoose.model("Chat", chatSchema);
