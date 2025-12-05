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
    refreshToken: {
        type: Array,
        default: []
    }
});

export default new mongoose.model("User", userSchema);
