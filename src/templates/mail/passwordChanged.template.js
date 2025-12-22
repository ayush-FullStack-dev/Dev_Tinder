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
