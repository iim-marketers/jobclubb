import "server-only";

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer; cid: string; contentType: string }[];
}) {
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
