// lib/nodemailer.ts
"use strict";
import nodemailer from "nodemailer";

const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
  throw new Error(
    "Please define GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env.local"
  );
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer configuration error:", error);
  } else {
    console.log("Nodemailer transporter ready");
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"Gleen Photography" <${GMAIL_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendBulkEmail(emails: EmailOptions[]) {
  try {
    const results = await Promise.all(emails.map((email) => sendEmail(email)));
    return results;
  } catch (error) {
    console.error("Error sending bulk email:", error);
    return { success: false, error: "Failed to send bulk email" };
  }
}
