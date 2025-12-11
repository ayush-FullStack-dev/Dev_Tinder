import mailer from "nodemailer";
import {
    verifyAccountTemplate,
    verifyOtpTemplete,
    suspiciousAlertTemplete,
    newLoginAlertTemplete
} from "../templates/mail.js";

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
            deviceInfo.time
        )
    );
    return mailInfo;
};

export const sendSuspiciousAlert = async (userMail, deviceInfo) => {
    const link = `${process.extra.DOMAIN_LINK}/account/activity/`;
    for (const info in deviceInfo) {
        deviceInfo[info] = deviceInfo[info] || "test";
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
            deviceInfo.time
        )
    );
    return mailInfo;
};

export const sendLoginAlert = async (userMail, userInfo) => {
    const link = `${process.extra.DOMAIN_LINK}/account/resetPassword/`;

    for (const info in userInfo) {
        userInfo[info] = userInfo[info] || "test";
    }

    const mailInfo = await sendMail(
        userMail,
        `New login to DevTinder from ${userInfo.deviceName}`,
        suspiciousAlertTemplete(
            userMail,
            userInfo.name,
            userInfo.ip,
            userInfo.location,
            userInfo.deviceModel,
            userInfo.browser,
            userInfo.time,
            link
        )
    );
    return mailInfo;
};
