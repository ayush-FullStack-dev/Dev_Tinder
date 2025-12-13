const suspiciousAlertTemplete = (
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
        <img src='${process.extra?.DOMAIN_LINK}/images/DevTinder.png' />
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

export default suspiciousAlertTemplete;