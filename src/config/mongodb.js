import mongoose from "mongoose";
import ApiError from "../helpers/ApiError.js";
import config from "./config.js";

import { success, info ,errorLog} from "../../logs/printLogs.js";

async function connectMongo() {
    try {
        info("CONNECTING DATABASE ...");
        await mongoose.connect(config.MONGO_URL);
        success("DATABASE CONNECTED ✓");
    } catch (error) {
        errorLog("DB CONNECTION FAILED ");
        errorLog(error.message);
        process.exit(1);
    }
}

export default connectMongo;
