import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
        min: 
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ["female", "male", "transgender"]
    }
});
