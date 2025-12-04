import mongoose from "mongoose";
import { userSchema } from "./User.js";

const tempUserSchema = new mongoose.Schema({
    ...userSchema.obj,
    token: {
        type: String,
        required: true
    },
    expireAt: {
        type: Number,
        default: Date.now()
    }
});

export default new mongoose.model("PendingUser", tempUserSchema);
