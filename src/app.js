import express from "express";
import authRouter from "./api/routes/auth.js";

// configure app
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    process.env.DOMAIN = req.get("host");
    if (process.env.DOMAIN.includes("localhost")) {
        process.env.DOMAIN_LINK = `http://${process.env.DOMAIN}`;
    } else {
        process.env.DOMAIN_LINK = `https://${process.env.DOMAIN}`;
    }
    next();
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
