import mongoose from "mongoose";

const profileSeenSchema = new mongoose.Schema({
    viewerProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    seenProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },

    action: {
        type: String,
        enum: ["like", "pass"],
        required: true
    },
    seenAt: {
        type: Date,
        default: () => new Date()
    },
    deletedAt: {
        type: Date,
        default: null,
        expires: 0
    }
});

profileSeenSchema.index(
  { viewerProfileId: 1, seenProfileId: 1 },
  { unique: true }
);

export default mongoose.model("profileSeen", profileSeenSchema);
