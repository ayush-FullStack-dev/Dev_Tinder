import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

// routes
import authRouter from "./api/routes/auth.route.js";
import pushRouter from "./api/routes/push.route.js";
import profileRouter from "./api/routes/profile.route.js";
import discoverRouter from "./api/routes/discover.route.js";

// global routes
import {
    getInfo,
    handleError,
    handleNotFound
} from "./api/controllers/controller.js";

// others import
import { getPath } from "./utilities/index.js";

// configure appp
const app = express();

app.set("trust proxy", true);
app.set("json spaces", 2);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(getPath.publicDir));
app.use(cookieParser(process.env.APP_SECRET));
app.use(helmet());
app.use(getInfo);

// routes
app.use("/push", pushRouter);
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/discover", discoverRouter);

// error handers
app.use("/", handleNotFound);
app.use(handleError);

export default app;
