export const passwordChangedAlertTemplate = (
    name,
    device,
    location,
    time,
    securityLink
) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Password Changed</title>

<style>
  body {
    margin: 0;
    padding: 0;
    background: #f5f7fb;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Helvetica, Arial, sans-serif;
  }

  .wrapper {
    width: 100%;
    padding: 30px 15px;
  }

  .card {
    max-width: 520px;
    margin: auto;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }

  .header {
    background: linear-gradient(135deg, #1f2937, #111827);
    padding: 24px;
    text-align: center;
    color: #ffffff;
  }

  .header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  .content {
    padding: 28px;
    color: #111827;
  }

  .content p {
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 14px;
  }

  .info-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 16px;
    margin: 20px 0;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 8px;
    color: #374151;
  }

  .info-row strong {
    color: #111827;
  }

  .alert {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 10px;
    padding: 14px;
    font-size: 14px;
    color: #9a3412;
    margin-top: 18px;
  }

  .cta {
    margin-top: 26px;
    text-align: center;
  }

  .cta a {
    display: inline-block;
    padding: 12px 22px;
    background: #ef4444;
    color: #ffffff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
  }

  .footer {
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    padding: 18px;
    background: #f9fafb;
  }
</style>
</head>

<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <h1>Password Changed</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${name}</strong>,</p>

      <p>
        This is a security alert to let you know that your account password was
        changed successfully.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span>Device</span>
          <strong>${device}</strong>
        </div>
        <div class="info-row">
          <span>Location</span>
          <strong>${location}</strong>
        </div>
        <div class="info-row">
          <span>Time</span>
          <strong>${time}</strong>
        </div>
      </div>

      <div class="alert">
        If this wasn’t you, your account may be at risk.
        Please secure your account immediately.
      </div>

      <div class="cta">
        <a href="${securityLink}">
          Secure My Account
        </a>
      </div>
    </div>

    <div class="footer">
      This is an automated security message.<br />
      Please do not reply to this email.
    </div>
  </div>
</div>
</body>
</html>`;
    return html;
};

export const forgotPasswordTemplate = (name, link) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Password Reset</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    * {
      font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    body {
      margin: 0;
      padding: 0;
      background: #f4f6fb;
      color: #111827;
    }

    .container {
      padding: 40px 12px;
    }

    .card {
      max-width: 520px;
      margin: auto;
      background: #ffffff;
      border-radius: 14px;
      padding: 32px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.08);
    }

    .title {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .subtitle {
      font-size: 14px;
      color: #4b5563;
      line-height: 22px;
      margin-bottom: 24px;
    }

    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      padding: 14px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      margin-bottom: 20px;
    }

    .info {
      font-size: 13px;
      color: #374151;
      line-height: 20px;
      margin-bottom: 20px;
    }

    .warn {
      background: #f9fafb;
      border: 1px dashed #d1d5db;
      border-radius: 10px;
      padding: 14px;
      font-size: 13px;
      color: #374151;
      margin-bottom: 20px;
    }

    .footer {
      font-size: 12px;
      color: #6b7280;
      margin-top: 28px;
    }

    .muted {
      color: #6b7280;
      word-break: break-all;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="card">

      <div class="title">Reset your password</div>

      <div class="subtitle">
        Hi <strong>${name}</strong>,<br>
        We received a request to reset your account password.
      </div>

      <a href="${link}" class="btn">
        Reset Password
      </a>

      <div class="info">
        This link will expire in <strong>15 minutes</strong> for your security.
      </div>

      <div class="warn">
        If you didn’t request a password reset, you can safely ignore this email.
        Your account will remain secure.
      </div>

      <div class="info muted">
        Or copy & paste this link into your browser:<br>
        ${link}
      </div>

      <div class="footer">
        DevTinder Security Team<br>
        © 2025 DevTinder Inc.
      </div>

    </div>
  </div>
</body>
</html>`;
    return html;
};

export const resetPasswordAlertTemplate = (
    name,
    device,
    browser,
    os,
    location,
    ip,
    time
) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Password Reset Successful</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
  * {
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }

  body {
    margin: 0;
    padding: 0;
    background: linear-gradient(180deg, #f4f6fb 0%, #eef2ff 100%);
    color: #111827;
  }

  .card {
    max-width: 560px;
    background: #ffffff;
    border-radius: 16px;
    padding: 34px;
    box-shadow: 0 20px 40px rgba(0,0,0,.10);
  }

  .badge {
    display: inline-block;
    background: #ecfdf5;
    color: #047857;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 14px;
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 15px;
    color: #4b5563;
    margin-bottom: 26px;
    line-height: 24px;
  }

  .device-card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 24px;
    background: #f9fafb;
  }

  .device-title {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .device-meta {
    font-size: 14px;
    color: #4b5563;
    line-height: 21px;
  }

  .info {
    font-size: 14px;
    color: #374151;
    margin-bottom: 20px;
  }

  .warning {
    background: #fff7ed;
    border-left: 4px solid #f59e0b;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 14px;
    color: #92400e;
  }

  .footer {
    font-size: 12px;
    color: #6b7280;
    margin-top: 32px;
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
  }
</style>
</head>

<body>
<table width="100%" cellpadding="0" cellspacing="0" style="padding:44px 14px;">
<tr>
<td align="center">

<table class="card" cellpadding="0" cellspacing="0">
<tr>
<td>

<div class="badge">Security update</div>

<div class="title">Password reset successful</div>

<div class="subtitle">
Hi <strong>${name}</strong>,<br>
Your account password has been successfully updated.
</div>

<div class="device-card">
  <div class="device-title">Reset performed from</div>
  <div class="device-meta">
    ${device} · ${browser} · ${os}<br>
    ${location} · ${ip}<br>
    <strong>Time:</strong> ${time}
  </div>
</div>

<div class="info">
For your protection, we signed you out from all active devices.
Please sign in again using your new password.
</div>

<div class="warning">
<strong>Was this not you?</strong><br>
If you didn’t reset your password, contact our support team immediately.
</div>

<div class="footer">
DevTinder Security Team<br>
© 2025 DevTinder Inc. All rights reserved.
</div>

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
