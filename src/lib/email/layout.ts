import "server-only";

import { EMAIL_LOGO_CID, EMAIL_LOGO_PNG } from "@/lib/email/assets/logo";
import { SITE_URL } from "@/lib/site-url";

export const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailDetail = { label: string; value: string; href?: string };

export type EmailContent = {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  greeting: string;
  paragraphs: string[];
  details?: EmailDetail[];
  closing?: string[];
  cta?: { label: string; url: string };
  footer: string;
};

const SIGN_OFF = ["Regards,", "Team JobClubb"];

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#4a5a63;">${escape(text)}</p>`;

function detailsTable(details: EmailDetail[]) {
  const rows = details
    .map(({ label, value, href }, i) => {
      const border = i === details.length - 1 ? "" : " border-bottom:1px solid #e3eaee;";
      const shown = href
        ? `<a href="${escape(href)}" target="_blank" style="color:#00789f; text-decoration:underline; word-break:break-all;">${escape(value)}</a>`
        : escape(value);
      return `<tr>
                          <td valign="top" width="38%" style="padding:12px 12px 12px 0;${border} font-size:13px; line-height:1.5; color:#6b7a82;">${escape(label)}</td>
                          <td valign="top" style="padding:12px 0;${border} font-size:14px; line-height:1.5; font-weight:700; color:#0f1d24;">${shown}</td>
                        </tr>`;
    })
    .join("\n                        ");

  return `<tr>
                  <td class="px" style="padding:4px 40px 20px; font-family:Arial, Helvetica, sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f8fa; border-radius:14px;">
                      <tr>
                        <td style="padding:6px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${rows}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

function ctaButton({ label, url }: { label: string; url: string }) {
  return `<tr>
                  <td align="center" class="px" style="padding:12px 40px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#00789f" style="border-radius:12px;">
                          <a href="${escape(url)}"
                            target="_blank" class="btn"
                            style="display:inline-block; padding:14px 32px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:12px;">
                            ${escape(label)}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

export function renderEmail(content: EmailContent) {
  const { subject, preheader, eyebrow, heading, greeting, paragraphs, details, closing = [], cta, footer } =
    content;
  const site = escape(SITE_URL);

  const text = [
    greeting,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...(details?.length ? [...details.map((d) => `${d.label}: ${d.value}`), ""] : []),
    ...closing.flatMap((p) => [p, ""]),
    ...(cta ? [`${cta.label}:`, cta.url, ""] : []),
    ...SIGN_OFF,
    "",
    "---",
    footer,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escape(subject)}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .pt { padding-top: 32px !important; }
      .h1 { font-size: 22px !important; }
      .btn { display: block !important; padding: 14px 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f2f6f8; -webkit-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f2f6f8;">
    ${escape(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f6f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding:0 0 15px;">
              <a href="${site}" style="text-decoration:none;">
                <img src="cid:${EMAIL_LOGO_CID}" width="174" height="44" alt="JobClubb"
                  style="display:block; border:0; height:44px; width:auto; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:800; color:#00789f;">
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
                  <td class="px pt" style="padding:40px 40px 4px; font-family:Arial, Helvetica, sans-serif;">
                    <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; color:#00789f;">
                      ${escape(eyebrow)}
                    </p>
                    <h1 class="h1" style="margin:0 0 20px; font-size:24px; line-height:1.3; font-weight:800; color:#0f1d24;">
                      ${escape(heading)}
                    </h1>
                    ${paragraph(greeting)}
                    ${paragraphs.map(paragraph).join("\n                    ")}
                  </td>
                </tr>
                ${details?.length ? detailsTable(details) : ""}
                ${
                  closing.length
                    ? `<tr>
                  <td class="px" style="padding:4px 40px 0; font-family:Arial, Helvetica, sans-serif;">
                    ${closing.map(paragraph).join("\n                    ")}
                  </td>
                </tr>`
                    : ""
                }
                ${cta ? ctaButton(cta) : ""}
                <tr>
                  <td class="px" style="padding:0 40px 40px; font-family:Arial, Helvetica, sans-serif;">
                    <p style="margin:0; font-size:15px; line-height:1.6; color:#4a5a63;">
                      ${SIGN_OFF.map(escape).join("<br>")}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#8a979e;">
              ${escape(footer)}
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
