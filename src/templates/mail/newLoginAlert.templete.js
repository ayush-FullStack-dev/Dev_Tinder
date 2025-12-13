const newLoginAlertTemplete = (
    name,
    ip,
    location,
    device,
    browser,
    time,
    reset_link
) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>New Login Detected</title>

<style>
  /* Base font */
  * {
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  }

  /* Auto Light Theme */
  @media (prefers-color-scheme: light) {
    body { background:#f6f7f9 !important; color:#1a1a1a !important; }
    .card { background:#ffffff !important; color:#1a1a1a !important; }
    .box { background:#f2f3f5 !important; }
    a { color:#0066ff !important; }
    .footer { color:#555 !important; }
  }

  /* Auto Dark Theme */
  @media (prefers-color-scheme: dark) {
    body { background:#121212 !important; color:#e6e6e6 !important; }
    .card { background:#1b1b1b !important; color:#e6e6e6 !important; }
    .box { background:#2a2a2a !important; }
    a { color:#4da3ff !important; }
    .footer { color:#9e9e9e !important; }
  }

  /* Small screens responsive */
  @media only screen and (max-width: 480px) {
    .card { padding:22px !important; }
    .title { font-size:22px !important; }
    .box { padding:16px !important; }
  }
</style>

</head>

<body style="margin:0; padding:0; background:#f6f7f9;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 12px;">
  <tr>
    <td align="center">

      <!-- CARD -->
      <table class="card" width="100%" cellpadding="0" cellspacing="0"
        style="max-width:500px; background:#ffffff; border-radius:14px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">

        <!-- LOGO -->
        <tr>
          <td align="left" style="padding-bottom:20px;">
            <img src'${process.extra?.DOMAIN_LINK}/images/DevTinder.png' width="40" alt="DevTinder Logo" style="border-radius:8px;">
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td class="title" style="font-size:26px; font-weight:700; padding-bottom:16px;">
            New login detected
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="font-size:15px; line-height:24px; padding-bottom:18px;">
            Hi <strong>${name}</strong>,
            <br><br>
            We noticed a new login to your DevTinder account.
          </td>
        </tr>

        <!-- Info Box -->
        <tr>
          <td class="box"
            style="padding:20px; border-radius:12px; background:#f2f3f5; font-size:14px; line-height:22px;">

            <strong>Time:</strong> ${time}<br>
            <strong>IP:</strong> ${ip}<br>
            <strong>Location:</strong> ${location}<br>
            <strong>Device:</strong> ${device}<br>
            <strong>Browser:</strong> ${browser}<br>

          </td>
        </tr>

        <!-- CTA SECTION -->
        <tr>
          <td style="font-size:15px; line-height:24px; padding-top:24px;">
            If this wasn't you, please  
            <a href="${reset_link}">reset your password</a>  
            and enable  
            <a href='${process.extra.DOMAIN_LINK}/images/DevTinder.png'>two-factor authentication</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="footer" style="font-size:13px; padding-top:32px; line-height:20px; text-align:left;">
            DevTinder Security Team<br><br>
            © 2025 DevTinder Inc.
          </td>
        </tr>

      </table>
      <!-- CARD END -->

    </td>
  </tr>
</table>

</body>
</html>`;
    return html;
};

export default newLoginAlertTemplete;
