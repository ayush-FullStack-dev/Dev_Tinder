import express from "express";
import authRouter from "./api/routes/auth.route.js";
import pushRouter from "./api/routes/push.route.js"
import cookieParser from "cookie-parser";
import { getPath } from "./utilities/index.js";
// configure appp
const app = express();

app.set("trust proxy", true);
app.set("json spaces", 2);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(getPath.publicDir));
app.use(cookieParser(process.env.APP_SECRET));
app.use((req, res, next) => {
    let ip = req.ip;
    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    } else if (ip === "::1") {
        ip = "127.0.0.1";
    }
    req.realIp = ip;
    if (!process.extra?.DOMAIN) {
        process.extra = {};
        process.extra.DOMAIN = req.get("host");
        if (process.extra.DOMAIN.includes("localhost")) {
            process.extra.DOMAIN_LINK = `http://${process.extra.DOMAIN}`;
        } else {
            process.extra.DOMAIN_LINK = `https://${process.env.DOMAIN}`;
        }
    }
    next();
});

// routes
app.use("/", pushRouter);
app.use("/auth", authRouter);

// error handers
app.use("/", (req, res) => {
    res.status(404).json({
        success: false,
        message: "404 Route not Found!"
    });
});

app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        success: false,
        type: error.name || "InternalServerError",
        message: error.message || "something went wrong!"
    });
});

export default app;
