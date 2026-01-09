import mongoose from "mongoose";

import { techStacks, lookingFor, role } from "../constants/profile.constant.js";

const profileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            required: true,
            index: true
        },

        username: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 500
        },
        role: {
            type: String,
            required: true,
            enum: role
        },
        looking_for: {
            type: [String],
            enum: lookingFor,
            required: true,
            validate: v => v.length > 0
        },
        tech_stack: {
            type: [String],
            enum: techStacks,
            required: true,
            validate: v => v.length > 0
        },
        experience_years: {
            type: Number,
            min: 0,
            max: 50,
            required: true
        },
        location: {
            city: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            },
            geo: {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point"
                },
                coordinates: {
                    type: [Number],
                    required: true
                }
            }
        },
        visibility: {
            type: String,
            default: "public",
            enum: ["public", "hidden"]
        },
        profileScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
            index: true
        }
    },
    {
        timestamps: true
    }
);

profileSchema.index({ "location.geo": "2dsphere" });

export default new mongoose.model("Profile", profileSchema);
