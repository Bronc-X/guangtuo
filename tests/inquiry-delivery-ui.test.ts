import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {buildEmailDraft, buildProposalDraft} from '../src/lib/ai-mail';
import {createAdminApi} from '../src/lib/admin-api';
import * as api from '../src/lib/api-client';
import * as ui from '../src/components/admin-inquiries';
import type {StoredInquiry} from '../services/content-admin/inquiries';

it('uses the persistent same-origin API by default in production', () => {
  expect(api).toHaveProperty('resolveInquiryApiBaseUrl');
  expect(api.resolveInquiryApiBaseUrl(undefined, true)).toBe('/api');
  expect(api.resolveInquiryApiBaseUrl(undefined, false)).toBeUndefined();
  expect(api.resolveInquiryApiBaseUrl('https://api.example.test/v1', true)).toBe('https://api.example.test/v1');
  const source = readFileSync('src/components/job-status.tsx', 'utf8');
  expect(source).toContain('remoteMode ?');
});

it('provides review controls and cannot send a pending draft or mail without SMTP', () => {
  expect(ui).toHaveProperty('InquiryEditor');
  const input = {name: 'QA', businessEmail: 'qa@example.test', company: 'Brand', market: 'EU', category: 'eye', sku: 'GT-EYE-001', configuration: '', quantity: '1000', budget: 'Review', launchDate: '2027', productGoal: 'Eye care', packagingPreference: 'Jar', certificationConstraints: '', notes: 'Private note', privacyConsent: true as const};
  const proposal = buildProposalDraft(input, 'zh');
  const record: StoredInquiry = {id: 'test', version: 1, createdAt: 1, updatedAt: 1, locale: 'zh', generator: 'rules', input, proposal, email: buildEmailDraft(proposal, input, 'zh'), delivery: {attempts: 0}};
  const markup = renderToStaticMarkup(createElement(ui.InquiryEditor, {record, smtpConfigured: false, api: createAdminApi(), onUpdated: () => undefined}));
  expect(markup).toContain('qa@example.test');
  expect(markup).toContain('邮件主题');
  expect(markup).toContain('邮件正文');
  expect(markup).toContain('尚未配置发件服务');
  expect(markup).toContain('SMTP_NOT_CONFIGURED');
  expect(markup).toMatch(/role="alert"[^>]*>[^<]*SMTP_NOT_CONFIGURED/);
  expect(markup).toMatch(/disabled=""[^>]*>发送邮件/);
  expect(markup).toContain('重新生成免费模板');
  expect(markup).toContain('下载回复草稿');
  expect(markup).not.toContain('交给外部服务处理');
  expect(readFileSync('src/components/admin-console.tsx', 'utf8')).toContain("id: 'inquiries'");
});

it('exposes the SMTP configuration error on an empty inquiry list as well', () => {
  const source = readFileSync('src/components/admin-inquiries.tsx', 'utf8');
  expect(source).toMatch(/!items\.length\s*\?\s*<>\{!smtpConfigured\s*&&\s*<SmtpConfigurationError/);
});
