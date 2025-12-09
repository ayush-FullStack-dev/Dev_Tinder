export const verifyAccountTemplate = link => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - DevTinder</title>
    <style>
        body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important; }
        body, table, td, div, p, a { -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; border-spacing: 0; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; display: block; width: 100%; }

        /* FONTS */
        @import url('https://fonts.googleapis.com/css2?family=Helvetica:wght@400;700&display=swap');
        
        /* RESPONSIVE STYLES */
        @media screen and (max-width: 600px) {
            .mobile-padding { padding: 40px 20px !important; }
            .mobile-header-padding { padding: 30px 20px !important; }
            .content-width { width: 100% !important; max-width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica', Arial, sans-serif;">

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                <table class="content-width" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; max-width: 600px; width: 100%;">
                    
                    <tr>
                        <td class="mobile-header-padding" align="center" style="background-color: #2b2e4a; padding: 40px;">
                            <img src="https://5d8d199d-aff8-468a-b72a-c2e22a5ce80a.b-cdn.net/e/f0130c43-ced4-4c0b-aed6-872ffaf95155/61e09d4d-8873-4a90-bb39-594d82e77c0c.png" alt="DevTinder Logo" width="80" style="width: 80px; height: auto; display: block;">
                            <h2 style="color: #ffffff; margin: 20px 0 0 0; font-size: 24px; font-weight: 700;">DevTinder</h2>
                        </td>
                    </tr>

                    <tr>
                        <td class="mobile-padding" align="center" style="padding: 50px 40px;">
                            
                            <div style="font-size: 48px; margin-bottom: 20px;">✉️</div>

                            <h1 style="color: #333333; margin: 0 0 15px 0; font-size: 22px; font-weight: bold; line-height: 1.4;">Verify your email address</h1>
                            
                            <p style="color: #666666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                You're almost ready to start matching! Please verify your email address to secure your DevTinder account.
                            </p>

                            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                                <tr>
                                    <td align="center" style="border-radius: 8px;" bgcolor="#E94560">
                                        <a href=${link} target="_blank" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; border: 1px solid #E94560; display: inline-block; background-color: #E94560;">Verify Email</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #999999; margin-top: 30px; font-size: 13px; line-height: 1.5;">
                                If you didn't create an account with DevTinder, you can safely ignore this email.
                            </p>

                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #eeeeee;">
                            <p style="color: #b0b0b0; font-size: 12px; margin: 0;">
                                &copy; 2025 DevTinder Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
        </tr>
    </table>

</body>
</html>`;

    return html;
};

export const verifyOtpTemplete = (OTP, BROWSER, OS, IP, COUNTRY, TIME) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevTinder Security Verification</title>

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        body { margin: 0; padding: 0; background: #f3f4f6; font-family: 'Inter', sans-serif; }
        table { border-collapse: collapse; width: 100%; }

        @media screen and (max-width: 600px) {
            .box { width: 100% !important; border-radius: 0 !important; }
            .otp { font-size: 32px !important; letter-spacing: 5px !important; }
            .body-pad { padding: 30px 20px !important; }
        }
    </style>
</head>

<body style="padding: 40px 0;">

    <table width="100%">
        <tr>
            <td align="center">

                <table class="box" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; 
                box-shadow: 0 8px 35px rgba(0,0,0,0.10); overflow: hidden;">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background: #111827; padding: 28px;">
                            <img src="https://5d8d199d-aff8-468a-b72a-c2e22a5ce80a.b-cdn.net/e/f0130c43-ced4-4c0b-aed6-872ffaf95155/61e09d4d-8873-4a90-bb39-594d82e77c0c.png" 
                                 width="55">
                            <h2 style="color: white; margin: 10px 0 0; font-size: 20px;">DevTinder Security</h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="body-pad" style="padding: 40px;">

                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1f2937;">
                                Your Verification Code
                            </h1>

                            <p style="color: #6b7280; margin: 14px 0 28px; font-size: 15px; line-height: 1.6;">
                                To continue signing in to your <strong>DevTinder</strong> account,
                                please enter the verification code below.  
                                This login attempt may require extra verification for your safety.
                            </p>

                            <!-- OTP BOX -->
                            <table width="100%">
                                <tr>
                                    <td align="center">
                                        <div style="padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1; background: #f8fafc; width: 80%;">
                                            <span class="otp" style="font-size: 42px; font-family: monospace; 
                                            font-weight: 700; letter-spacing: 10px; color: #0f172a;">
                                                ${OTP}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #64748b; font-size: 13px; margin-top: 25px;">
                                This code will expire in <strong>10 minutes</strong>.
                            </p>

                            <!-- Security Info -->
                            <div style="margin-top: 32px; background: #f1f5f9; padding: 20px; border-radius: 12px;">
                                <h3 style="margin: 0 0 10px; font-size: 15px; color: #1e293b;">🔐 Login Details</h3>

                                <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                                    <strong>IP:</strong> ${IP}
                                </p>
                                <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                                    <strong>Location:</strong> ${COUNTRY}
                                </p>
                                <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                                    <strong>Browser:</strong> ${BROWSER}
                                </p>
                                <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                                    <strong>OS:</strong> ${OS}
                                </p>
                                <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                                    <strong>Time:</strong> ${TIME}
                                </p>
                            </div>

                            <p style="color: #ef4444; font-size: 12px; margin-top: 14px;">
                                If this wasn't you, someone else may be trying to access your account.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 18px;">
                            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                                © 2025 DevTinder. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>

                <p style="color: #9ca3af; margin-top: 18px; font-size: 12px;">
                    Made with ❤️ for developers worldwide
                </p>

            </td>
        </tr>
    </table>

</body>
</html>`;
    return html;
};

export const suspiciousAlertTemplete = (
    email,
    ip,
    browser,
    os,
    country,
    secure_link,
    time
) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>Security Alert</title>

<style>
    body {
        margin: 0; padding: 0;
        background: #f6f6f6;
        font-family: "Roboto", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
    }

    .container {
        max-width: 520px;
        width: 90%;
        margin: 40px auto;
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(0,0,0,0.15);
    }

    .header {
        text-align: center;
        padding: 25px 10px 5px;
    }

    .header img {
        width: 90px;
        max-width: 30%;
    }

    .alert-icon {
        font-size: 35px;
        text-align: center;
        color: #d93025;
        margin-top: 8px;
    }

    .title {
        font-size: 22px;
        font-weight: 500;
        color: #202124;
        text-align: center;
        padding: 0 15px;
    }

    .email-text {
        text-align: center;
        color: #5f6368;
        font-size: 15px;
        margin-bottom: 18px;
        padding: 0 15px;
        word-break: break-word;
    }

    .body {
        padding: 0 24px 30px;
    }

    .message {
        font-size: 15px;
        color: #3c4043;
        line-height: 1.6;
        text-align: center;
    }

    .info-box {
        margin-top: 20px;
        background: #fafafa;
        border: 1px solid #dadce0;
        border-radius: 10px;
        padding: 18px;
    }

    .info-box p {
        margin: 7px 0;
        font-size: 14px;
        color: #3c4043;
        line-height: 1.4;
        word-break: break-word;
    }

    .btn-wrap {
        text-align: center;
        margin-top: 25px;
    }

    .btn {
        background: #d93025;
        padding: 12px 28px;
        border-radius: 6px;
        color: #fff;
        font-size: 15px;
        text-decoration: none;
        font-weight: 500;
        display: inline-block;
    }

    .btn:hover {
        background: #b72a20;
    }

    .footer {
        text-align: center;
        padding: 18px;
        font-size: 12px;
        color: #5f6368;
        background: #fafafa;
        border-top: 1px solid #eee;
    }

    /* ====================== RESPONSIVE ====================== */

    @media (max-width: 480px) {
        .title { font-size: 19px; }
        .alert-icon { font-size: 36px; }

        .info-box {
            padding: 14px;
        }

        .info-box p {
            font-size: 13px;
        }

        .btn {
            width: 90%;
            padding: 14px;
            font-size: 16px;
        }

        .container {
            margin-top: 20px;
        }
    }

    @media (max-width: 360px) {
        .title { font-size: 17px; }
        .message { font-size: 14px; }
        .info-box { padding: 12px; }
    }
</style>

</head>
<body>

<div class="container">

    <div class="header">
        <img src="https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg" />
    </div>


    <div class="title">❗someone tried to access  your DevTinder account</div>

    <div class="email-text">${email}</div>

    <div class="body">

        <p class="message">
            We detected unusual activity that suggests someone else may know your password.  
            Please review the details below to secure your account.
        </p>

        <div class="info-box">
            <p><strong> Location:</strong> ${country}</p>
            <p><strong>🌐 IP Address:</strong> ${ip}</p>
            <p><strong>🖥 Device:</strong> ${browser} • ${os}</p>
            <p><strong>⏱ Time:</strong> ${time}</p>
        </div>

        <div class="btn-wrap">
            <a class="btn" href="${secure_link}">
                Secure your account
            </a>
        </div>

    </div>

    <div class="footer">
        This email was sent because DevTinder detected unusual login activity.<br>
        © 2025 DevTinder Security
    </div>

</div>

</body>
</html>`;
    return html;
};
