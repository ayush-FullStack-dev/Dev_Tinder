import mailer from "nodemailer";
import { verifyAccountTemplate } from "../templates/mail.js";

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
        from: `"DevTinder" <no-reply@${process.env.DOMAIN}>`,
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
    const verifyLink = `${process.env.DOMAIN_LINK}/auth/verify?token=${verificationToken}`;
    const mailInfo = await sendMail(
        userMail,
        "Verify Your Email Address",
        verifyAccountTemplate(verifyLink)
    );
    return mailInfo;
};
