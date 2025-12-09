import connectDB from "./src/config/mongodb.js";
import { connectRedis } from "./src/config/redis.js";
import app from "./src/app.js";

// configure server
const port = process.env.PORT || 3000;

function startServer() {
    app.listen(port, () => {
        console.log(`server is listening on port ${port}`);
    });
}

async function init() {
    if (process.env.NODE_ENV === "production") {
        try {
            await connectDB();
            connectRedis();
            startServer();
        } catch (error) {
            console.log("Database Connected failed! Error is:", error);
            process.exit(1);
        }

        return;
    }

    startServer();
    connectRedis();
    connectDB().catch(err => {
        console.log("Database Connected failed! Error is:", err);
    });
}

init();
