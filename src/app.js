import express from "express";
import authRouter from "./api/routes/auth.js";
import cookieParser from "cookie-parser";

// configure app
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.APP_SECRET));
app.use((req, res, next) => {
	process.extra = {}
    process.extra.DOMAIN = req.get("host");
    if (process.extra.DOMAIN.includes("localhost")) {
        process.extra.DOMAIN_LINK = `http://${process.extra.DOMAIN}`;
    } else {
        process.extra.DOMAIN_LINK = `https://${process.env.DOMAIN}`;
    }
    next();
});

app.get("/sync", (req, res) => {
    throw new Error("sync exploded");
});
// routes
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
