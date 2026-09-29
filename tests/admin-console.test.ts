import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';

import AdminConsole, * as adminConsole from '@/components/admin-console';

const root = process.cwd();

describe('customer content console route', () => {
  it('exposes PDF attachments without rendering them as image options', () => {
    const source = readFileSync(join(root, 'src/components/admin-console.tsx'), 'utf8');
    const managed = readFileSync(join(root, 'src/components/admin-managed-content.tsx'), 'utf8');
    expect(source).toContain('application/pdf');
    const field = readFileSync(join(root, 'src/components/admin-media-field.tsx'), 'utf8');
    expect(field).toContain("asset.mimeType.startsWith('image/')");
    expect(managed).toContain("key: 'pdfMediaId'");
    expect(field).toContain("asset.mimeType === 'application/pdf'");
  });
  it('ships a private admin route that mounts the interactive content console', () => {
    const pagePath = join(root, 'src/app/admin/page.tsx');
    const consolePath = join(root, 'src/components/admin-console.tsx');

    expect(existsSync(pagePath), 'admin page').toBe(true);
    expect(existsSync(consolePath), 'admin console').toBe(true);

    const page = readFileSync(pagePath, 'utf8');
    const consoleSource = readFileSync(consolePath, 'utf8');

    expect(page).toContain('robots: {index: false, follow: false}');
    expect(page).toContain('<AdminConsole');
    expect(consoleSource).toContain("'use client'");
  });

  it('validates the minimum article fields before publication', () => {
    expect(adminConsole).toHaveProperty('validateArticleDraft');
    const validateArticleDraft = (adminConsole as unknown as {
      validateArticleDraft: (draft: {title: string; summary: string; cover: string; body: string}) => string[];
    }).validateArticleDraft;

    expect(validateArticleDraft({title: '', summary: '', cover: '', body: ''})).toEqual([
      '请填写文章标题',
      '请填写内容摘要',
      '请选择封面图片',
      '请填写文章正文'
    ]);
    expect(validateArticleDraft({
      title: '水凝胶眼膜如何选择膜型',
      summary: '从贴合部位、包装方式和护理方向说明常见膜型。',
      cover: '/assets/editorial/sample-review.png',
      body: '选择膜型前，先确认使用部位和目标包装。'
    })).toEqual([]);
  });

  it('starts with plain-language tasks instead of a technical CMS dashboard', () => {
    const markup = renderToStaticMarkup(createElement(AdminConsole));
    const source = readFileSync(join(root, 'src/components/admin-console.tsx'), 'utf8');

    for (const label of [
      '工作台',
      '网站首页',
      '联系我们',
      '产品',
      '膜型',
      '专利与创新',
      '文章',
      '图片与文件',
      '发布记录',
      '写新文章',
      '修改首页',
      '上传图片'
    ]) {
      expect(source).toContain(label);
    }

    expect(markup).toContain('正在进入内容工作台');
    expect(source).toContain("id: 'products'");
    expect(source).toContain('ManagedContentView');
    expect(markup).not.toContain('Content Manager');
    expect(markup).not.toContain('Entry');
    expect(markup).not.toContain('Asset');
  });

  it('uses direct operation copy instead of narrating the implementation', () => {
    const source = readFileSync(join(root, 'src/components/admin-console.tsx'), 'utf8');
    for (const phrase of [
      '每次保存和发布都会真实写入内容服务',
      '内容服务已连接',
      '真实文件库',
      '真实发布结果',
      '内容服务中的可用图片',
      '只开放首屏标题、简介和图片',
      '不会改变页面结构',
      '正在从内容服务读取最新数据'
    ]) {
      expect(source).not.toContain(phrase);
    }
  });

  it('keeps every navigation name available when narrow-screen CSS hides its visible label', () => {
    const consoleSource = readFileSync(join(root, 'src/components/admin-console.tsx'), 'utf8');

    expect(consoleSource).toContain('aria-label={item.label}');
  });

  it('contains the decorative sidebar artwork on narrow screens', () => {
    const consoleStyles = readFileSync(join(root, 'src/components/admin-console.module.css'), 'utf8');

    expect(consoleStyles).toContain('.sidebar::before { display: none; }');
  });

  it('uses a single-operator publish flow without approval handoffs', () => {
    const consoleSource = readFileSync(join(root, 'src/components/admin-console.tsx'), 'utf8');
    const plan = readFileSync(join(root, 'docs/customer-content-admin-plan.md'), 'utf8');

    for (const label of ['确认发布', '发布文章', '发布首页', '发布记录', '网站维护人']) {
      expect(consoleSource).toContain(label);
    }

    for (const workflowLabel of ['提交审核', '待审核', '审核与发布', '用户与权限', '第二人审核', '李经理', '陈小姐']) {
      expect(consoleSource).not.toContain(workflowLabel);
    }

    expect(plan).toContain('单人维护模式');
    expect(plan).not.toContain('提交审核');
    expect(plan).not.toContain('第二人审核');
  });
});
