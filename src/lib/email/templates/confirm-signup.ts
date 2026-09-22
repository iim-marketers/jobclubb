import "server-only";

import { EMAIL_LOGO_CID, EMAIL_LOGO_PNG } from "@/lib/email/assets/logo";


const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function confirmSignupEmail({
  firstName,
  email,
  confirmUrl,
  siteUrl,
}: {
  firstName?: string;
  email: string;
  confirmUrl: string;
  siteUrl: string;
}) {
  const name = firstName?.trim();
  const heading = name ? `Welcome to JobClubb, ${escape(name)}!` : "Welcome to JobClubb!";
  const address = escape(email);
  const url = escape(confirmUrl);
  const site = escape(siteUrl);

  const subject = "Confirm your email to activate your JobClubb account";

  const text = [
    name ? `Welcome to JobClubb, ${name}!` : "Welcome to JobClubb!",
    "",
    `You're one step away. Confirm ${email} to activate your account, then sign in:`,
    confirmUrl,
    "",
    "For your security, this link expires in 1 hour and works only once.",
    "If it has expired, sign in and we'll send you a new one.",
    "",
    `You're receiving this because ${email} was used to create a JobClubb account.`,
    "If this wasn't you, you can safely ignore this email. No account will be activated.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Confirm your email</title>
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
    One click to activate your JobClubb account and start applying to verified openings.
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
                      Confirm your email
                    </p>
                    <h1 class="h1" style="margin:0 0 16px; font-size:26px; line-height:1.25; font-weight:800; color:#0f1d24;">
                      ${heading}
                    </h1>
                    <p style="margin:0 0 28px; font-size:16px; line-height:1.6; color:#4a5a63;">
                      You're one step away. Confirm <strong style="color:#0f1d24;">${address}</strong> to activate your account.
                      Then sign in to get started.
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
                            Confirm my email &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="px" style="padding:0 40px 32px; font-family:Arial, Helvetica, sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f8fa; border-radius:14px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px; font-size:13px; font-weight:700; color:#0f1d24;">Once you're in, you can:</p>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="top" style="padding:0 10px 8px 0; font-size:14px; color:#00bea2; font-weight:700;">&#10003;</td>
                              <td style="padding:0 0 8px; font-size:14px; line-height:1.5; color:#4a5a63;">Build your AI-powered, ATS-ready resume</td>
                            </tr>
                            <tr>
                              <td valign="top" style="padding:0 10px 8px 0; font-size:14px; color:#00bea2; font-weight:700;">&#10003;</td>
                              <td style="padding:0 0 8px; font-size:14px; line-height:1.5; color:#4a5a63;">Browse verified openings matched to your city</td>
                            </tr>
                            <tr>
                              <td valign="top" style="padding:0 10px 0 0; font-size:14px; color:#00bea2; font-weight:700;">&#10003;</td>
                              <td style="font-size:14px; line-height:1.5; color:#4a5a63;">Apply with your identity hidden until you choose to reveal it</td>
                            </tr>
                          </table>
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
                      If it has expired, sign in and we'll send you a new one.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#8a979e;">
              You're receiving this because ${address} was used to create a JobClubb account.
              If this wasn't you, you can safely ignore this email. No account will be activated.
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
