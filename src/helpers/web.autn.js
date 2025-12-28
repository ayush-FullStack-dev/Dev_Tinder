import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from "@simplewebauthn/server";

export const getPasskey = async user => {
    const options = await generateAuthenticationOptions({
        rpID: "localhost",
        allowCredentials: user.loginMethods.passkeys.keys.map(k => ({
            id: k.credentialId, 
            type: "public-key"
        })),
        userName: user.email,
        userDisplayName: user.name,
        timeout: 60000,
        attestationType: "none",
        userVerification: "required",
        authenticatorSelection: {
            userVerification: "required"
        }
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
            message: "We couldn’t verify this psskey. Please try again.",
            action: "RESTRT_LOGIN"
        };
    }

    return verification;
};
