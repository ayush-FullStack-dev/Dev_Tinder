import sendResponse from "../../../../helpers/sendResponse.js";

export const manageMfaHandler = (req, res) => {
    const { user } = req.auth;

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
    const { user } = req.auth;

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

    return sendResponse(res, 200, "TwoFA enabled successfully");
};
