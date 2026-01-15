import Mailgun from "mailgun.js";
import { Interfaces, type MailgunMessageData } from "mailgun.js/definitions";
import FormData from "form-data";
import env from "./env";
import { EmailsTemplates, loadEmailTemplateFile } from "./loadTemplateFolder";
import fs from "node:fs/promises";

const mailgun = new Mailgun(FormData); // or import formData from 'form-data';
const mg = mailgun.client({
  username: "api",
  key: env.MAILGUN_API_KEY || "",
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const messageData: MailgunMessageData = {
    from: `No-Reply <no-reply@${env.MAILGUN_DOMAIN}>`,
    to,
    subject,
    text,
  };

  if (html) {
    messageData.html = html;
  }

  try {
    const response = await mg.messages.create(env.MAILGUN_DOMAIN, messageData);
    console.log("Email sent:", response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendRegisterEmail(to: string, token: string) {
  const subject = "Serverseer - Confirm Your Email";
  const emailTemplate = loadEmailTemplateFile(
    EmailsTemplates.REGISTER,
    "new_account.html"
  );
  const templateContent = await fs.readFile(emailTemplate, "utf-8");
  const confirmationLink = `${env.WEB_PANEL_URL}/confirm-email?token=${token}`;
  const html = templateContent.replaceAll(
    "{{registration_link}}",
    confirmationLink
  );

  await sendEmail(to, subject, "", html);
}

export async function sendInviteRegisterEmail(
  from: string,
  to: string,
  token: string
) {
  const subject = "Serverseer - You're Invited to Join";
  const emailTemplate = loadEmailTemplateFile(
    EmailsTemplates.REGISTER,
    "invite_account.html"
  );
  const templateContent = await fs.readFile(emailTemplate, "utf-8");
  const registrationLink = `${env.WEB_PANEL_URL}/register?token=${token}`;
  let html = templateContent.replaceAll(
    "{{registration_link}}",
    registrationLink
  );
  html = html.replaceAll("{{inviter_name}}", from);

  await sendEmail(to, subject, "", html);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const subject = "Serverseer - Password Reset Request";
  const emailTemplate = loadEmailTemplateFile(
    EmailsTemplates.ACCOUNT,
    "password_reset.html"
  );
  const templateContent = await fs.readFile(emailTemplate, "utf-8");
  const resetLink = `${env.WEB_PANEL_URL}/reset-password?token=${token}`;
  const html = templateContent.replaceAll("{{reset_password_link}}", resetLink);

  await sendEmail(to, subject, "", html);
}
