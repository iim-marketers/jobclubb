import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer; cid: string; contentType: string }[];
};

export async function sendEmail(message: EmailMessage) {
  if (process.env.NODE_ENV === "production") await sendWithResend(message);
  else await sendWithSmtp(message);
}

async function sendWithResend(message: EmailMessage) {
  const { RESEND_API_KEY, RESEND_FROM } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM) {
    throw new Error("RESEND_API_KEY and RESEND_FROM must be set to send email.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        content_type: a.contentType,
        content_id: a.cid,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend request failed (${res.status}): ${await res.text()}`);
  }
}

let transporter: Transporter | undefined;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set to send email.");
  }

  const port = Number(SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

async function sendWithSmtp(message: EmailMessage) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    ...message,
  });
}
