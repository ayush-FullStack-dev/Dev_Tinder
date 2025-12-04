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
