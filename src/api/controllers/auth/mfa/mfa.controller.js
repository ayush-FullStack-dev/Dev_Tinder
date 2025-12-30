import sendResponse from "../../../../helpers/sendResponse.js";

import { createAuthEvent } from "../../../../services/authEvent.service.js";
import { buildAuthInfo } from "../../../../helpers/authEvent.js";

export const manageMfaHandler = async (req, res) => {
    const { user, risk, device, verifyInfo } = req.auth;

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "get_mfa",
            risk: risk
        })
    );

    return sendResponse(res, 200, {
        message: "all mfa methods fetched successfully",
        mfa: {
            twoStepEnabled: !!user.twoFA.enabled,
            secondSteps: {
                passkeys: {
                    enabled: !!user.passkeys.length,
                    count: user.passkeys.length
                },
                authenticator: {
                    enabled: !!user.twoFA.twoFAMethods.totp.enabled
                },
                googlePrompt: {
                    enabled: !!user?.trustedSession?.length,
                    devices: user?.trustedSession?.length
                },
                email: {
                    enabled: user.twoFA.twoFAMethods.email.enabled,
                    emails: user.twoFA.twoFAMethods.email.emails
                },
                backupCodes: {
                    enabled: user.twoFA.twoFAMethods.backupCodes.enabled,
                    remaining: user.twoFA.twoFAMethods.backupCodes.codes.length
                }
            },

            lastUpdated: user.twoFA.twoFAMethods.lastUpdated
        }
    });
};

export const enableTwoFA = async (req, res) => {
    const { user, risk, device, verifyInfo } = req.auth;

    if (user.twoFA.enabled) {
        return sendResponse(
            res,
            200,
            "TwoFactorAuthentication Already enabled on your account"
        );
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.enabled": true
        }
    );

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "enable_twoFA",
            risk: risk
        })
    );

    return sendResponse(res, 200, "TwoFA enabled successfully");
};
