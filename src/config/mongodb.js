import mongoose from "mongoose";
import ApiError from "../helpers/ApiError.js";
import config from "./config.js";

import { success, info } from "../../logs/printLogs.js";

async function connectMongo() {
    info("CONNECTING DATABASE ...");
    await mongoose.connect(config.MONGO_URL);
    success("DATABASE CONNECTED ✓");
}

export default connectMongo;
