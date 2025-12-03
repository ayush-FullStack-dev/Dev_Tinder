import dotenv from "dotenv";
import { getPath } from "../utilities/index.js";

dotenv.config({
    path: getPath.envPath
});

const config = {
    MONGO_URL: process.env.MONGO_URL || "mongouri://localhost:5127/test",
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    DB: {
        HOST: process.env.DB_HOST || "localhost",
        USER: process.env.DB_USER || "root",
        PASS: process.env.DB_PASS || "KASHI@123AB",
        NAME: process.env.DB_NAME || "zoom"
    },
    googleAuth: {
        CLIENT_ID: process.env.CLIENT_ID || null,
        CLIENT_SECRET: process.env.CLIENT_SECRET || null,
        CALLBACK_URI: process.env.CALLBACK_URI || null
    }
};


export default config;
