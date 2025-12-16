import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from "@simplewebauthn/server";

export const getSecurityKey = async user => {
    const options = await generateAuthenticationOptions({
        rpID: process.extra.DOMAIN,
        allowCredentials: user.securityKeys.map(k => ({
            id: Buffer.from(k.credentialId, "base64url"),
            type: "public-key",
            transports: ["usb", "nfc", "ble"]
        })),
        userVerification: "required",
        authenticatorSelection: {
            authenticatorAttachment: "cross-platform",
            userVerification: "required"
        }
    });
    return options;
};

export const getPasskey = async user => {
    const options = await generateAuthenticationOptions({
        rpID: process.extra.DOMAIN,
        allowCredentials: user.passkeys.map(k => ({
            id: Buffer.from(k.credentialId, "base64url"),
            type: "public-key"
        })),
        userVerification: "required"
    });
    return options;
};

export const verifyKey = async (auth, saved, passkey) => {
    const verification = await verifyAuthenticationResponse({
        response: auth,
        expectedChallenge: saved.challenge,
        expectedOrigin: process.extra.DOMAIN_LINK,
        expectedPRID: process.extra.DOMAIN,
        authenticator: {
            credentialPublicKey: passkey.publickey,
            counter: passkey.counter
        }
    });

    if (!verification?.verified) {
        return {
            success: false,
            message: "We couldn’t verify this sign-in. Please try again.",
            action: "RESTART_LOGIN"
        };
    }

    return verification;
};
