import connectDB from "./src/config/mongodb.js";
import { connectRedis } from "./src/config/redis.js";
import { webPushStart } from "./src/config/webpush.js";
import app from "./src/app.js";

import chalk, {
    printASCII,
    errorLog,
    success,
    info
} from "./logs/printLogs.js";

// configure server
const port = process.env.PORT || 3000;

function startServer() {
    app.listen(port, () => {
        info("STARTING SERVER ...");
        console.log(chalk.gray(`server is listening on port ${port} ...`));
        success("SERVER STARTED ✓");
    });
}

async function init() {
    info("SERVICE WAKING UP ...");
    if (process.env.NODE_ENV === "production") {
        console.clear();
        try {
            await connectDB();
            connectRedis();
            startServer();
            webPushStart();
            printASCII("WELCOME");
        } catch (err) {
            errorLog("BOOT FAILED ❌");
            console.error(err);
            process.exit(1);
        }
    }

    startServer();
    connectRedis();
    connectDB().catch(err => {
        errorLog("Database Connected failed! Error is:", error);
    });
    webPushStart();
    printASCII("WELCOME TO BACKEND");
}

init();
