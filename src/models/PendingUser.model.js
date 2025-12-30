import mongoose from "mongoose";
import { userSchema } from "./User.model.js";

const tempUserSchema = new mongoose.Schema({
    ...userSchema.obj,
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 1000 * 60 * 30),
        expires: 0
    }
});

export default new mongoose.model("PendingUser", tempUserSchema);
