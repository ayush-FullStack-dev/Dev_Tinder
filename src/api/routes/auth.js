import express from "express";
import { signupHandler, verifyEvl } from "../controllers/auth.js";
import { signupValidation } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signupValidation, signupHandler);
router.get("/verify", verifyEvl);

export default router;
