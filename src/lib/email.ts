// src/lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // für 587 false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
};

export async function sendMail(args: SendMailArgs) {
  const from = process.env.EMAIL_FROM || "no-reply@pagefoundry.de";

  // EMAIL_ENABLED stand seit jeher in der .env, wurde aber nie ausgewertet — die Tests
  // haben dadurch echte Mails über den Prod-SMTP verschickt. Alles außer "true" schaltet
  // den Versand ab (Prod setzt EMAIL_ENABLED="true").
  if (process.env.EMAIL_ENABLED !== "true") {
    console.info(`[email] Versand deaktiviert (EMAIL_ENABLED != "true") — an: ${args.to}, Betreff: ${args.subject}`);
    return { messageId: "email-disabled", accepted: [], rejected: [args.to] };
  }

  const info = await transporter.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    text: args.text ?? "",
    html: args.html,
    attachments: args.attachments,
  });

  return info;
}
