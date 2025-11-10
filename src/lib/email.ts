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
