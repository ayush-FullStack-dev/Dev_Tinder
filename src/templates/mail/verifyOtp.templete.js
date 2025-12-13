 const verifyOtpTemplete = (OTP, BROWSER, OS, IP, COUNTRY, TIME) => {
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
                            <img src='${process.extra?.DOMAIN_LINK}/images/DevTinder.png'
                                 width="55">
                            <h2 style="color: white; margin: 10px 0 0; font-size: 20px;">DevTinder Security</h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>

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

export default verifyOtpTemplete;
