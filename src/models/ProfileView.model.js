import mongoose from "mongoose";

const profileViewSchema = new mongoose.Schema({
    viewerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    viewedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    viewedAt: {
        type: Date,
        default: () => new Date()
    }
});

export default mongoose.model("ProfileView", profileViewSchema);
