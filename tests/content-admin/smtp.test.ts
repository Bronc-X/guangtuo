import {expect, it} from 'vitest';
import * as smtp from '../../services/content-admin/smtp';

it('requires all credentials and enforces authenticated encrypted SMTP', () => {
  expect(smtp).toHaveProperty('smtpConfiguration');
  expect(smtp.smtpConfiguration({})).toBeNull();
  expect(() => smtp.smtpConfiguration({SMTP_HOST: 'smtp.example.test'})).toThrow('SMTP_CONFIGURATION_INCOMPLETE');
  const env = {SMTP_HOST: 'smtp.example.test', SMTP_USER: 'user', SMTP_PASSWORD: 'private-secret', SMTP_FROM: 'website@showkibiotech.com'};
  expect(smtp.smtpConfiguration(env)).toMatchObject({host: env.SMTP_HOST, port: 465, secure: true, requireTLS: true, tls: {rejectUnauthorized: true}});
  expect(smtp.smtpConfiguration({...env, SMTP_PORT: '587'})).toMatchObject({port: 587, secure: false, requireTLS: true});
  expect(() => smtp.smtpConfiguration({...env, SMTP_PORT: '25'})).toThrow('SMTP_PORT_MUST_BE_465_OR_587');
  expect(() => smtp.smtpConfiguration({...env, SMTP_FROM: 'a@example.com\r\nBcc: b@example.com'})).toThrow();
});
