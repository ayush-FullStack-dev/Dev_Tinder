import crypto from "crypto";
import epochify from "epochify";
import geoip from "geoip-lite";

import ApiError from "../../helpers/ApiError.js";
import { sendResponse } from "../../helpers/helpers.js";

import { getAccesToken, getRefreshToken } from "../../helpers/helpers.js";

import {
    findUser,
    createUser,
    findPendingUser,
    createPendingUser,
    deletePendingUser
} from "../services/auth.js";
import { sendVerifyLink } from "../../helpers/mail.js";
import { generateHash, verifyHash } from "../../helpers/hash.js";

const cookieOption = {
    httpOnly: true,
    signed: true,
    secure: true
};

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
    return sendResponse(res, 200, {
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
        return sendResponse(res, 410, {
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

    return sendResponse(res, 201, {
        message: "user created successfull",
        data: {
            name: userData.name,
            email: userData.email,
            username: userData.username,
            picture: userData.picture
        }
    });
};

function cleanIP(ip) {
    if (ip.startsWith("::ffff:")) {
        return ip.replace("::ffff:", "");
    }
    return ip;
}

export const loginHandler = async (req, res) => {
    const { login, fieldName, password } = res.locals;
    const ip = cleanIP(req.ip);
    const geo = geoip.lookup(ip);
    const country = geo?.country || "UNKNOWN";
    let refreshExpiry = "1d";
    const message = "Invalid credentials!";
    const user = await findUser({
        [fieldName]: login
    });

    if (!user) {
        return sendResponse(res, 401, {
            message
        });
    }
    const checkHash = await verifyHash(password, user.password);

    if (!checkHash) {
        return sendResponse(res, 401, {
            message
        });
    }

    if (user.refreshToken.length) {
        const lastSession = user.refreshToken[user.refreshToken.length - 1];
        const checkTime = epochify.diff(
            Date.now(),
            lastSession.createdAt,
            "minute"
        );
        if (req.body.deviceId === lastSession.deviceId) {
        } else if (req.body.ip === lastSession.ip) {
        } else if (req.body.os === lastSession.os) {
        } else if (country === lastSession.country && checkTime > 15) {
        } else {
            // 2fa logic
        }
    }

    if (req.body.remember) {
        refreshExpiry = "30d";
    }
    const accesToken = getAccesToken({
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        age: user.age,
        gender: user.gender
    });

    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    const userInfo = {
        browser: req.body.browser,
        os: req.body.os,
        deviceId: req.body.deviceId,
        ip,
        token: refreshToken,
        version: 1,
        country,
        createdAt: Date.now()
    };

    user.refreshToken.push(userInfo);

    if (user.refreshToken.length > process.env.ALLOWED_TOKEN) {
        user.refreshToken.shift();
    }
    res.status(200)
        .cookie("accesToken", accesToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json({
            success: true,
            message: "User login successfully"
        });
};

// cleanup function
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
