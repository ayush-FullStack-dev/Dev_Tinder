import express from "express";
import { signupHandler, verifyEvl, loginHandler } from "../controllers/auth.js";
import { signupValidation, loginValidation } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signupValidation, signupHandler);
router.get("/verify", verifyEvl);

router.post("/login", loginValidation, loginHandler);

export default router;
