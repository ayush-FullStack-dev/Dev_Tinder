import sendResponse from "../../../helpers/sendResponse.js";

import {
    generateRegistrationOptions,
    verifyRegistrationResponse
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";

import { updateUser } from "../../../services/user.service.js";
import {
    getSession,
    setSession,
    cleanupMfa
} from "../../../services/session.service.js";

import { buildDeviceInfo } from "../../../helpers/buildDeviceInfo.js";
import { getIpInfo } from "../../../helpers/ip.js";

function detectDeviceType(transports = []) {
    if (
        transports.includes("usb") ||
        transports.includes("nfc") ||
        transports.includes("ble")
    ) {
        return "hardware-key";
    }

    return null;
}

export const activePasskeysHandler = (req, res) => {
    const { user } = req.auth;
    const passkeyMethod = user.loginMethods.passkeys;
    console.log(passkeyMethod);
    const passkeys = [];

    for (const keyInfo of passkeyMethod.keys) {
        passkeys.push({
            id: keyInfo._id,
            name: keyInfo.name,
            deviceType: keyInfo.deviceType,
            platform: keyInfo.platform,
            browser: keyInfo.browser,
            addedAt: keyInfo.addedAt,
            lastUsedAt: keyInfo.lastUsedAt
        });
    }

    return sendResponse(res, 200, {
        enabled: passkeyMethod.enabled,
        count: passkeyMethod.keys?.length,
        passkeys,
        createdAt: passkeyMethod.createdAt,
        canAdd: true,
        canRemove: true,
        canRename: true
    });
};

export const addNewPasskeyHandler = async (req, res) => {
    const { user, hashedToken } = req.auth;

    const info = await getSession(`passkey:challenge:${hashedToken}`);
    const passkeys = {
        enabled: true,
        keys: [...user.loginMethods.passkeys?.keys],
        createdAt: user.loginMethods.passkeys.createdAt || Date.now()
    };
    if (!info?.verified) {
        const excludeCredentials = user.loginMethods.passkeys.keys.map(pk => ({
            id: isoUint8Array.fromBase64URL(pk.credentialID),
            type: "public-key",
            transports: pk.transports || []
        }));
        const options = await generateRegistrationOptions({
            rpName: "http://localhost:8158",
            rpID: "localhost",
            userID: isoUint8Array.fromUTF8String(user._id),
            userName: user.email,
            userDisplayName: user.name,
            timeout: 60000,
            attestationType: "none",
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "required"
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },
                { type: "public-key", alg: -257 }
            ],
            excludeCredentials,
            hints: ["client-device", "hybrid"]
        });

        await setSession(
            {
                userId: user._id,
                verified: true,
                challenge: options.challenge
            },
            hashedToken,
            "passkey:challenge",
            "EX",
            70
        );

        return sendResponse(res, 202, {
            message: "Sign given challenge to continue. ",
            passkey: options
        });
    }

    const deviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        getIpInfo(req.realIp)
    );

    const verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: info.challenge,
        expectedOrigin: "http://localhost:8158",
        expectedRPID: "localhost",
        requireUserVerification: true
    });

    if (!verification?.verified) {
        return sendResponse(
            res,
            401,
            "Passkey verification failed. Please try again."
        );
    }

    passkeys.keys.push({
        credentialId: verification.registrationInfo.credential.id,
        publicKey: Buffer.from(
            verification.registrationInfo.credential.publicKey
        ).toString("base64url"),

        counter: verification.registrationInfo.credential.counter,
        transports: [verification.registrationInfo.credential.transports],
        name: deviceInfo.deviceName,
        platform: deviceInfo.os,
        deviceType:
            detectDeviceType(
                verification.registrationInfo.credential.transports
            ) || deviceInfo.deviceType,
        browser: deviceInfo.browser
    });

    await updateUser(
        {
            _id: user._id
        },
        {
            "loginMethods.passkeys": passkeys
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 201, "Passkey added successfully");
};

export const editPasskeyHandler = async (req, res) => {
    const { user } = req.auth;

    if (!user.loginMethods.passkeys?.enabled) {
        return sendResponse(
            res,
            403,
            "Passkey is not enabled in this account first enable it."
        );
    }

    const index = user.loginMethods.passkeys.keys.findIndex(
        k => k.id === req.body?.id
    );

    if (index === -1) {
        return sendResponse(
            res,
            401,
            "Invalid Passkey id passkey not exist with this id."
        );
    }

    if (!req.body?.name) {
        return sendResponse(
            res,
            400,
            "Add a name to this passkey so you can recognize it."
        );
    }
    
    user.loginMethods.passkeys.keys[index].name = req.body?.name;

    await updateUser(
        {
            _id: user._id
        },
        {
            "loginMethods.passkeys": user.loginMethods.passkeys
        }
    );

    return sendResponse(res, 200, "Passkey renamed successfully");
};

export const deletePasskeyHandler = async (req, res) => {
    const { user, hashedToken } = req.auth;

    if (!user.loginMethods.passkeys?.enabled) {
        return sendResponse(
            res,
            403,
            "Passkey is not enabled in this account first enable it"
        );
    }

    const index = user.loginMethods.passkeys.keys.findIndex(
        k => k.id === req.body?.id
    );

    if (index === -1) {
        return sendResponse(
            res,
            401,
            "Invalid Passkey id passkey not exist with this id"
        );
    }

    user.loginMethods.passkeys.keys.splice(index, 1);

    if (!user.loginMethods.passkeys.keys?.length) {
        user.loginMethods.passkeys.enabled = false;
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            "loginMethods.passkeys": user.loginMethods.passkeys
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 200, "Passkey remove successfully");
};
