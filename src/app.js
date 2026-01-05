import express from "express";
import helmet from "helmet";

import authRouter from "./api/routes/auth.route.js";
import pushRouter from "./api/routes/push.route.js";
import cookieParser from "cookie-parser";
import { getPath } from "./utilities/index.js";
import {
    getInfo,
    handleError,
    handleNotFound
} from "./api/controllers/controller.js";

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
app.use("/", pushRouter);
app.use("/auth", authRouter);

// error handers
app.use("/", handleNotFound);
app.use(handleError);

export default app;
