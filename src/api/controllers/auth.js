import crypto from "crypto";
import epochify from "epochify";

import ApiError from "../../helpers/ApiError.js";

import {
    findUser,
    createUser,
    findPendingUser,
    createPendingUser,
    deletePendingUser
} from "../services/auth.js";
import { sendVerifyLink } from "../../helpers/mail.js";
import { generateHash, verifyHash } from "../../helpers/hash.js";

export const signupHandler = async (req, res) => {
    let { name, email, username, password, gender, role } = req.body;
    const verificationToken = crypto
        .randomBytes(Number(process.env.BYTE))
        .toString("hex");
    password = await generateHash(password);
    const userData = await createPendingUser({
        name,
        email,
        username,
        password,
        role,
        gender,
        token: verificationToken,
        expireAt: Date.now()
    });
    const sendEvl = await sendVerifyLink(email, verificationToken);
    res.status(200).json({
        success: true,
        message: "Verification Link Send Succesfull",
        data: {
            name: userData.name,
            email: userData.email,
            username: userData.username
        }
    });
};

export const verifyEvl = async (req, res) => {
    const token = req.query.token;
    if (!token) {
        throw new ApiError("BadRequest", " Token is not found in query", 400);
    }
    if (token.length !== Number(process.env.BYTE) * 2) {
        throw new ApiError("BadRequest", " Token is invalid or corrupted", 400);
    }
    const findData = await findPendingUser({
        token
    });
    if (!findData) {
        throw new ApiError(
            "UnauthorizedError",
            "Verify Token is invalid or expired",
            401
        );
    }
    const diff = epochify.getDiff(Date.now(), findData.expireAt, "minutes");

    if (diff > 15) {
        await deletePendingUser(findData._id, {
            id: true
        });
        return res.status(410).json({
            success: false,
            message: "Verify Token is expired!"
        });
    }

    const userData = await createUser({
        name: findData.name,
        email: findData.email,
        username: findData.username,
        password: findData.password,
        role: findData.role,
        gender: findData.gender
    });

    await deletePendingUser(findData._id, {
        id: true
    });

    res.status(201).json({
        success: true,
        message: "user created successfull",
        data: {
            name: userData.name,
            email: userData.email,
            username: userData.username,
            picture: userData.picture
        }
    });
};

const cleanupDbId = setInterval(
    async () => {
        try {
            const future = new Date();
            future.setMinutes(future.getMinutes() + 15);
            const currentTimeStamp = future.getTime();
            const user = await deletePendingUser({
                expireAt: {
                    $lt: currentTimeStamp
                }
            });
            console.log("cleanup successfully");
        } catch (error) {}
    },
    1000 * 60 * 30
);
