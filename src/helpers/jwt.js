import jwt from "jsonwebtoken";
import fs from "fs";

const privateKey = fs.readFileSync(
    "env/AsymmetricCryptography/jwt.private.key",
    "utf8"
);
const publicKey = fs.readFileSync(
    "env/AsymmetricCryptography/jwt.public.key",
    "utf8"
);

export function signToken(
    payload,
    expiresIn = "15m",
    audience = process.env.JWT_AUDIENCE
) {
    return jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn,
        audience,
        issuer: process.env.JWT_ISSUER
    });
}

export function verifyToken(
    token,
    audience = process.env.JWT_AUDIENCE,
    issuer = process.env.JWT_ISSUER
) {
    try {
        const decode = jwt.verify(token, publicKey, {
            audience,
            issuer,
            algorithms: ["RS256"]
        });
        return {
            success: true,
            message: "Token verify successfull",
            data: decode
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}
