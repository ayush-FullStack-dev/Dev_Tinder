import mongoose from "mongoose";
import ApiError from "../helpers/ApiError.js";
import config from "./config.js";

async function connectMongo() {

        await mongoose.connect(config.MONGO_URL);
        console.log("Database Connected Succesfull");
   
}

export default connectMongo;
