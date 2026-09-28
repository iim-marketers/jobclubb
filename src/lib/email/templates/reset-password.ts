import "server-only";

import { EMAIL_LOGO_CID, EMAIL_LOGO_PNG } from "@/lib/email/assets/logo";

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function resetPasswordEmail({
  firstName,
  email,
  resetUrl,
  siteUrl,
}: {
  firstName?: string;
  email: string;
  resetUrl: string;
  siteUrl: string;
}) {
  const name = firstName?.trim();
  const heading = name ? `Hi ${escape(name)}, let's get you back in` : "Let's get you back in";
  const address = escape(email);
  const url = escape(resetUrl);
  const site = escape(siteUrl);

  const subject = "Reset your JobClubb password";

  const text = [
    name ? `Hi ${name},` : "Hi,",
    "",
    `We got a request to reset the password for ${email}. Choose a new one here:`,
    resetUrl,
    "",
    "For your security, this link expires in 1 hour and works only once.",
    "If it has expired, request a new one from the sign-in page.",
    "",
    "If you didn't ask to reset your password, you can safely ignore this email. Your password won't change.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset your password</title>
  <style>
    @media only screen and (max-width: 480px) {
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .pt { padding-top: 32px !important; }
      .h1 { font-size: 23px !important; }
      .btn { display: block !important; padding: 15px 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f2f6f8; -webkit-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f2f6f8;">
    Choose a new password for your JobClubb account. The link expires in 1 hour.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f6f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${site}" style="text-decoration:none;">
                <img src="cid:${EMAIL_LOGO_CID}" width="142" height="26" alt="JobClubb"
                  style="display:block; border:0; height:26px; width:auto; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:800; color:#00789f;">
              </a>
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff; border:1px solid #e3eaee; border-radius:20px; overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="6" style="height:6px; line-height:6px; font-size:0; background-color:#00789f; background-image:linear-gradient(90deg, #00789f, #00bea2);">&nbsp;</td>
                </tr>

                <tr>
                  <td class="px pt" style="padding:40px 40px 8px; font-family:Arial, Helvetica, sans-serif;">
                    <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; color:#00789f;">
                      Reset your password
                    </p>
                    <h1 class="h1" style="margin:0 0 16px; font-size:26px; line-height:1.25; font-weight:800; color:#0f1d24;">
                      ${heading}
                    </h1>
                    <p style="margin:0 0 28px; font-size:16px; line-height:1.6; color:#4a5a63;">
                      We got a request to reset the password for <strong style="color:#0f1d24;">${address}</strong>.
                      Click below to choose a new one.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" class="px" style="padding:0 40px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#00789f" style="border-radius:12px;">
                          <a href="${url}"
                            target="_blank" class="btn"
                            style="display:inline-block; padding:15px 36px; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:12px;">
                            Choose a new password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="px" style="padding:0 40px 40px; font-family:Arial, Helvetica, sans-serif;">
                    <p style="margin:0 0 6px; font-size:13px; line-height:1.5; color:#6b7a82;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 16px; font-size:12px; line-height:1.5; word-break:break-all;">
                      <a href="${url}" style="color:#00789f; text-decoration:underline;">${url}</a>
                    </p>
                    <p style="margin:0; font-size:13px; line-height:1.5; color:#6b7a82;">
                      For your security, this link expires in 1 hour and works only once.
                      If it has expired, request a new one from the sign-in page.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#8a979e;">
              If you didn't ask to reset your password, you can safely ignore this email. Your password won't change.
              <br><br>
              &copy; JobClubb &middot; <a href="${site}/terms" style="color:#8a979e; text-decoration:underline;">Terms &amp; Conditions</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const attachments = [
    { filename: "jobclubb-logo.png", content: EMAIL_LOGO_PNG, cid: EMAIL_LOGO_CID, contentType: "image/png" },
  ];

  return { subject, html, text, attachments };
}
