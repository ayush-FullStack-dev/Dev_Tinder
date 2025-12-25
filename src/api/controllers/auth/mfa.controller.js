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
                    enabled: !!user.twoFA.loginMethods.totp.on
                },
                googlePrompt: {
                    enabled: !!user.trustedSession.length,
                    devices: user.trustedSession.length
                },
                email: {
                    enabled: user.twoFA.loginMethods.email.on,
                    emails: user.twoFA.loginMethods.email.emails
                },
                backupCodes: {
                    enabled: !!user.twoFA.loginMethods.backupcode.length,
                    remaining: user.twoFA.loginMethods.backupcode.length
                }
            },

            lastUpdated: user.twoFA.loginMethods.lastUpdated
        }
    });
};
