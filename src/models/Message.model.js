import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: ["text", "image", "video", "audio", "file", "system"],
            default: "text",
            index: true
        },

        text: {
            type: String,
            default: null,
            trim: true,
            maxlength: 4000
        },

        media: {
            key: { type: String, default: null },
            url: { type: String, default: null },
            mimeType: { type: String, default: null },
            size: { type: Number, default: 0 },
            name: { type: String, default: null },
            duration: { type: Number, default: null },
            width: { type: Number, default: null },
            height: { type: Number, default: null }
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
            index: true
        },

        deletedForEveryoneAt: {
            type: Date,
            default: null
        },

        deletedFor: {
            type: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Profile",
                        required: true
                    },
                    deletedAt: { type: Date, default: null }
                }
            ],
            default: []
        },

        deliveredTo: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Profile",
                default: null
            },
            deliveredAt: {
                type: Date,
                default: null
            }
        },
        readBy: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Profile",
                default: null
            },
            readAt: {
                type: Date,
                default: null
            }
        },

        e2ee: {
            enabled: { type: Boolean, default: false },
            ciphertext: { type: String, default: null },
            nonce: { type: String, default: null },
            algorithm: { type: String, default: "aes-256-gcm" },
            keyId: { type: String, default: null },
            version: { type: Number, default: 1 }
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ matchId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
