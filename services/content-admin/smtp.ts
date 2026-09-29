import nodemailer from 'nodemailer';
import {z} from 'zod';
import type {MailSender} from './inquiries';

export function smtpConfiguration(env: Record<string, string | undefined>) {
  const names = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'] as const;
  if (!names.some((name) => env[name])) return null;
  if (names.some((name) => !env[name])) throw new Error('SMTP_CONFIGURATION_INCOMPLETE');
  const port = Number(env.SMTP_PORT ?? 465);
  if (![465, 587].includes(port)) throw new Error('SMTP_PORT_MUST_BE_465_OR_587');
  z.email().parse(env.SMTP_FROM);
  return {
    host: env.SMTP_HOST!, port, secure: port === 465, requireTLS: true,
    auth: {user: env.SMTP_USER!, pass: env.SMTP_PASSWORD!},
    tls: {rejectUnauthorized: true}, connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000,
    disableFileAccess: true, disableUrlAccess: true
  };
}

export function createSmtpSender(env: Record<string, string | undefined> = process.env): MailSender | undefined {
  const configuration = smtpConfiguration(env);
  if (!configuration) return undefined;
  const transport = nodemailer.createTransport(configuration);
  return async (mail) => {
    const result = await transport.sendMail({from: env.SMTP_FROM, to: mail.to, subject: mail.subject, text: mail.body, messageId: mail.messageId});
    if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP_RECIPIENT_NOT_ACCEPTED');
    return {messageId: result.messageId};
  };
}
