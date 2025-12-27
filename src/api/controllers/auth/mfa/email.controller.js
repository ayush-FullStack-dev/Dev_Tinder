import sendResponse from "../../../../helpers/sendResponse.js";

import { generateHash, verifyHash } from "../../../../helpers/hash.js";
import { sendOtp } from "../../../../helpers/mail.js";

import {
    setSession,
    getSession,
    cleanupMfa
} from "../../../../services/session.service.js";
import { updateUser } from "../../../../services/user.service.js";

export const activeMailsHandler = (req, res) => {
    const { user } = req.auth;
    const response = {
        enabled: user.twoFA.twoFAMethods.email.enabled,
        emails: [],
        primary: null,
        createdAt: user.twoFA.twoFAMethods.email.createdAt,
        canAdd: true,
        canChange: true,
        canDisable: true
    };

    if (user.twoFA.twoFAMethods.email.emails.length > 0) {
        for (const email of user.twoFA.twoFAMethods.email.emails) {
            if (email.primary) {
                response.primary = email.value;
            }
            response.emails.push({
                value: email.value,
                verified: email.verified,
                addedAt: email.addedAt,
                lastUsedAt: email.lastUsedAt
            });
        }
    }

    return sendResponse(res, 200, response);
};

export const addNewMailHandler = async (req, res) => {
    const { user, device, hashedToken } = req.auth;
    const isMail =
        /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9-]{1,63}(\.[a-zA-Z0-9-]{1,63}){1,3}$/.test(
            req.body?.email
        );
    if (!isMail) {
        return sendResponse(res, 400, "Enter a valid email address");
    }

    const isDuplicateMail = user.twoFA.twoFAMethods.email.emails.find(
        e => e.value === req.body?.email
    );

    if (isDuplicateMail?.verified === false) {
        return sendResponse(res, 401, {
            message: "Email already exists you need to verify.",
            next: "sumbit_otp",
            route: "/auth/mfa/mange/email/verify/",
            request: "post"
        });
    }
    if (isDuplicateMail?.verified) {
        return sendResponse(res, 401, "Email already exists.");
    }

    if (!user.twoFA.twoFAMethods.email.enabled) {
        user.twoFA.twoFAMethods.email = {
            enabled: true,
            primary: req.body?.email,
            emails: [
                {
                    primary: true,
                    verified: false,
                    value: req.body?.email,
                    addedAt: Date.now()
                }
            ],
            createdAt: Date.now()
        };
    } else {
        user.twoFA.twoFAMethods.email.emails.push({
            value: req.body?.email,
            verified: false,
            addedAt: Date.now()
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await setSession(
        {
            otp: await generateHash(otp.toString()),
            value: req.body?.email,
            verified: false
        },
        hashedToken,
        "email:verified",
        "EX",
        180
    );
    await sendOtp(req.body?.email, otp, device);

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.twoFAMethods.email": user.twoFA.twoFAMethods.email
        }
    );

    return sendResponse(res, 200, {
        message: "Email added successfully",
        next: "sumbit_otp",
        route: "/auth/mfa/mange/email/verify/",
        request: "post"
    });
};

export const verifyMailHandler = async (req, res) => {
    const { user, deviceInfo, hashedToken } = req.auth;
    const info = await getSession(`email:verified:${hashedToken}`);

    if (!info) {
        return sendResponse(res, 401, {
            message:
                "Your verify email session has expired. Please start again.",
            action: "RESTART_VERIFACTION"
        });
    }
    if (!req.body?.email) {
        return sendResponse(res, 400, "Enter a valid email address");
    }
    if (!req.body?.value) {
        return sendResponse(res, 400, "OTP is required");
    }

    const isValidOtp = await verifyHash(req.body?.value, info.otp);

    if (!isValidOtp) {
        return sendResponse(res, 401, "invalid otp try again.");
    }

    const index = user.twoFA.twoFAMethods.email.emails.findIndex(
        k => k.value === info?.value
    );

    if (req.body?.email !== info?.value) {
        return sendResponse(
            res,
            401,
            "This request is prevent email hopping attack!"
        );
    }

    user.twoFA.twoFAMethods.email.emails[index].verified = true;

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.twoFAMethods.email": user.twoFA.twoFAMethods.email
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 201, "Email verified successfully");
};

export const revokeMailHandler = async (req, res) => {
    const { user, device, hashedToken } = req.auth;
    const method = user.twoFA.twoFAMethods.email;
    let emailInfo = null;
    if (!method.enabled) {
        return sendResponse(
            res,
            403,
            "email method is not enabled for your account"
        );
    }

    if (!req.body?.email) {
        return sendResponse(res, 400, "Enter a valid email address");
    }

    const index = method.emails.findIndex(k => k.value === req.body?.email);

    if (index === -1) {
        return sendResponse(res, 401, "Invalid email address");
    }

    if (method.primary === method.emails[index].value) {
        const info = await getSession(`email:verified:${hashedToken}`);

        if (!info) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            await setSession(
                {
                    otp: await generateHash(otp.toString()),
                    value: req.body?.email
                },
                hashedToken,
                "email:verified",
                "EX",
                300
            );
            await sendOtp(req.body?.email, otp, device);

            return sendResponse(res, 202, {
                message: "OTP sent successfully. Please verify to continue.",
                next: "VERIFY_OTP",
                expiresIn: 300
            });
        }

        if (req.body?.email !== info?.value) {
            return sendResponse(
                res,
                401,
                "This request is prevent email hopping attack!"
            );
        }

        if (!req.body?.value) {
            return sendResponse(res, 400, "OTP is required");
        }

        const isValidOtp = await verifyHash(req.body?.value, info.otp);

        if (!isValidOtp) {
            return sendResponse(res, 401, "invalid otp try again.");
        }
    }

    method.emails.splice(index, 1);
    if (!method.emails?.length) {
        emailInfo = {
            enabled: true,
            primary: null,
            emails: method.emails
        };

        for (const email of method.emails) {
            if (email.primary) {
                emailInfo.primary = email.value;
            }
        }
    } else {
        emailInfo = {
            enabled: false,
            primary: null,
            emails: []
        };
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.twoFAMethods.email": emailInfo
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 200, "Email removed successfully");
};
