import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
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
                message: "Match must have exactly 2 users"
            },
            index: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true
        },

        status: {
            type: String,
            enum: ["active", "unmatched", "blocked"],
            default: "active",
            index: true
        },

        

        unmatchedAt: {
            type: Date,
            default: null
        },

        unmatchedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            default: null
        },
        deletedAt: {
            type: Date,
            default: null,
            expires: 0
        }
    },
    {
        timestamps: true
    }
);

// ✅ one match per pair (order independent)
matchSchema.index({ users: 1 }, { unique: true });

export default mongoose.model("Match", matchSchema);
