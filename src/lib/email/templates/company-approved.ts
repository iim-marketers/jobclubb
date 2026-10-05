import "server-only";

import { EMAIL_LOGO_CID, EMAIL_LOGO_PNG } from "@/lib/email/assets/logo";

const NEXT_STEPS = [
  {
    title: "Post your first opening",
    body: "Reach verified candidates across Airlines, Hospitality and Travel.",
  },
  {
    title: "Review candidates by skill",
    body: "Profiles stay anonymous, so you shortlist on experience alone.",
  },
  {
    title: "Unlock the right profiles",
    body: "Reveal contact details only for the people you want to meet.",
  },
];

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function companyApprovedEmail({
  firstName,
  companyName,
  email,
  signInUrl,
  siteUrl,
}: {
  firstName?: string;
  companyName: string;
  email: string;
  signInUrl: string;
  siteUrl: string;
}) {
  const name = firstName?.trim();
  const company = escape(companyName);
  const address = escape(email);
  const url = escape(signInUrl);
  const site = escape(siteUrl);

  const subject = `${companyName} is verified on JobClubb`;

  const text = [
    name ? `Hi ${name},` : "Hi,",
    "",
    `Good news: ${companyName} is now verified on JobClubb. Your employer account is fully active.`,
    "",
    "Sign in to get started:",
    signInUrl,
    "",
    "What you can do now:",
    ...NEXT_STEPS.map((s) => `- ${s.title}: ${s.body}`),
    "",
    "Questions? Just reply to this email and our team will help.",
    "",
    `You're receiving this because ${email} is the contact for ${companyName} on JobClubb.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your company is verified</title>
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
    ${company} is verified. Sign in to post openings and start reviewing candidates.
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
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                      <tr>
                        <td width="48" height="48" align="center" valign="middle" bgcolor="#e6f6f1"
                          style="width:48px; height:48px; border-radius:24px; font-size:22px; line-height:48px; font-weight:700; color:#0a6b47;">
                          &#10003;
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; color:#0a6b47;">
                      Account verified
                    </p>
                    <h1 class="h1" style="margin:0 0 16px; font-size:26px; line-height:1.25; font-weight:800; color:#0f1d24;">
                      ${name ? `You're all set, ${escape(name)}!` : "You're all set!"}
                    </h1>
                    <p style="margin:0 0 28px; font-size:16px; line-height:1.6; color:#4a5a63;">
                      Our team has reviewed your details, and <strong style="color:#0f1d24;">${company}</strong>
                      is now verified on JobClubb. Your employer account is fully active.
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
                            Sign in to your account
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
                        <td style="padding:22px 24px 6px;">
                          <p style="margin:0 0 16px; font-size:13px; font-weight:700; color:#0f1d24;">What you can do now</p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            ${NEXT_STEPS.map(
                              (step, i) => `<tr>
                              <td valign="top" width="36" style="padding:0 0 16px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="24" height="24" align="center" valign="middle" bgcolor="#00789f"
                                      style="width:24px; height:24px; border-radius:12px; font-size:12px; line-height:24px; font-weight:700; color:#ffffff;">
                                      ${i + 1}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td valign="top" style="padding:2px 0 16px;">
                                <p style="margin:0 0 2px; font-size:14px; line-height:1.4; font-weight:700; color:#0f1d24;">${escape(step.title)}</p>
                                <p style="margin:0; font-size:13px; line-height:1.5; color:#4a5a63;">${escape(step.body)}</p>
                              </td>
                            </tr>`,
                            ).join("\n                            ")}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="px" style="padding:0 40px 40px; font-family:Arial, Helvetica, sans-serif;">
                    <p style="margin:0; font-size:13px; line-height:1.5; color:#6b7a82;">
                      Questions about getting started? Just reply to this email and our team will help.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#8a979e;">
              You're receiving this because ${address} is the contact for ${company} on JobClubb.
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
