export const logoutAllTemplate = (
    name,
    time,
    reason,
    trigger_ip,
    trigger_device,
    trigger_browser,
    trigger_os,
    trigger_location,
    reset_link
) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Logout Alert</title>

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

  .card {
    max-width: 540px;
    background: #ffffff;
    border-radius: 14px;
    padding: 32px;
    box-shadow: 0 12px 32px rgba(0,0,0,.08);
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .subtitle {
    font-size: 14px;
    color: #4b5563;
    margin-bottom: 22px;
    line-height: 22px;
  }

  .device-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 20px;
    background: #f9fafb;
  }

  .device-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .device-main {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .device-meta {
    font-size: 13px;
    color: #4b5563;
    line-height: 20px;
  }

  .reason {
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 10px;
    padding: 14px;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .info {
    font-size: 13px;
    line-height: 20px;
    color: #374151;
  }

  a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .footer {
    font-size: 12px;
    color: #6b7280;
    margin-top: 28px;
  }
</style>
</head>

<body>
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 12px;">
<tr>
<td align="center">

<table class="card" cellpadding="0" cellspacing="0">
<tr>
<td>

<div class="title">Logged out from all devices</div>

<div class="subtitle">
Hi <strong>${name}</strong>,<br>
Your account sessions were revoked across all devices.
</div>

<!-- DEVICE THAT TRIGGERED LOGOUT -->
<div class="device-card">
  <div class="device-title">Logout initiated from</div>
  <div class="device-main">${trigger_device}</div>
  <div class="device-meta">
    ${trigger_browser} · ${trigger_os}}<br>
    ${trigger_location} · ${trigger_ip}
  </div>
</div>

<!-- REASON -->
<div class="reason">
<strong>Reason:</strong> ${reason}
</div>

<!-- EXTRA DETAILS -->
<div class="info">
<strong>Action time:</strong> ${time}<br>
<strong>Sessions affected:</strong> All active devices
</div>

<div class="subtitle" style="margin-top:20px;">
If this wasn’t done by you, immediately
<a href="${reset_link}">reset your password</a>
and review your security activity.
</div>

<div class="footer">
DevTinder Security Team<br>
© 2025 DevTinder Inc.
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
