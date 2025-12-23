import mailer from "nodemailer";

import verifyAccountTemplate from "../templates/mail/verifyAccount.template.js";
import verifyOtpTemplete from "../templates/mail/verifyOtp.templete.js";
import suspiciousAlertTemplete from "../templates/mail/suspiciousAlert.templete.js";
import newLoginAlertTemplete from "../templates/mail/newLoginAlert.templete.js";

import { logoutAllTemplate } from "../templates/mail/logoutAlert.templete.js";
import {
    passwordChangedAlertTemplate,
    forgotPasswordTemplate
} from "../templates/mail/password.template.js";

const transporter = mailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL,
        pass: process.env.MAIL_PASS
    }
});

export const sendMail = async (mail, subject, html) => {
    const info = await transporter.sendMail({
        from: `"DevTinder" <no-reply@${process.extra.DOMAIN}>`,
        to: mail,
        subject,
        html
    });
    return {
        success: true,
        message: "Mail send Succesfull!",
        data: info
    };
};

export const sendVerifyLink = async (userMail, verificationToken) => {
    const verifyLink = `${process.extra.DOMAIN_LINK}/auth/verify?token=${verificationToken}`;
    const mailInfo = await sendMail(
        userMail,
        "Verify Your Email Address",
        verifyAccountTemplate(verifyLink)
    );
    return mailInfo;
};

export const sendOtp = async (userMail, otp, deviceInfo) => {
    const mailInfo = await sendMail(
        userMail,
        "“DevTinder: Confirm Your Sign-In",
        verifyOtpTemplete(
            otp,
            deviceInfo.browser,
            deviceInfo.os,
            deviceInfo.ip,
            deviceInfo.country,
            deviceInfo.fullTime.readable
        )
    );
    return mailInfo;
};

export const sendSuspiciousAlert = async (userMail, deviceInfo) => {
    const link = `${process.extra.DOMAIN_LINK}/account/activity/`;
    for (const info in deviceInfo) {
        deviceInfo[info] = deviceInfo[info] || "UNKNOWN";
    }

    const mailInfo = await sendMail(
        userMail,
        "“DevTinder: unusual activity Review you account!",
        suspiciousAlertTemplete(
            userMail,
            deviceInfo.ip,
            deviceInfo.browser,
            deviceInfo.os,
            deviceInfo.country,
            link,
            deviceInfo.fullTime.readable
        )
    );
    return mailInfo;
};

export const sendLoginAlert = async (userMail, userInfo) => {
    const link = `${process.extra.DOMAIN_LINK}/account/resetPassword/`;

    for (const info in userInfo) {
        userInfo[info] = userInfo[info] || "UNKNOWN";
    }

    const mailInfo = await sendMail(
        userMail,
        `New login to DevTinder from ${userInfo.deviceName}`,
        newLoginAlertTemplete(
            userMail,
            userInfo.name,
            userInfo.ip,
            userInfo.location,
            userInfo.deviceModel,
            userInfo.browser,
            userInfo.fullTime.readable,
            link
        )
    );
    return mailInfo;
};

export const sendLogoutAllAlert = async (userMail, userInfo) => {
    const link = `${process.extra.DOMAIN_LINK}/account/resetPassword/`;

    for (const info in userInfo) {
        userInfo[info] = userInfo[info] || "UNKNOWN";
    }

    const mailInfo = await sendMail(
        userMail,
        `Signed out from all devices`,
        logoutAllTemplate(
            userInfo.name,
            userInfo.fullTime.readable,
            userInfo.reason,
            userInfo.ip,
            userInfo.deviceModel,
            userInfo.browser,
            userInfo.os,
            userInfo.location,
            link
        )
    );
    return mailInfo;
};

export const sendPasswordChangedAlert = async (userMail, userInfo) => {
    const link = `${process.extra.DOMAIN_LINK}/account/resetPassword/`;

    for (const info in userInfo) {
        userInfo[info] = userInfo[info] || "UNKNOWN";
    }

    const mailInfo = await sendMail(
        userMail,
        `Your DevTinder password was changed`,
        passwordChangedAlertTemplate(
            userInfo.name,
            userInfo.deviceName,
            userInfo.location,
            userInfo.fullTime.readable,
            link
        )
    );

    return mailInfo;
};

export const sendforgotPasswordReq = async (user, link) => {
    const mailInfo = await sendMail(
        user.email,
        `Reset your DevTinder password`,
        forgotPasswordTemplate(user.name, link)
    );

    return mailInfo;
};
