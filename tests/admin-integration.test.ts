import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';

import AdminConsole from '@/components/admin-console';
import {createAdminApi} from '@/lib/admin-api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'}
  });
}

function sequenceFetch(responses: Response[]) {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({url: String(input), init});
    const response = responses.shift();
    if (!response) throw new Error('Unexpected fetch call');
    return response;
  }) as typeof fetch;
  return {calls, fetcher};
}

describe('real CMS integration', () => {
  it('has a dedicated browser API client', () => {
    const clientPath = join(process.cwd(), 'src/lib/admin-api.ts');
    expect(existsSync(clientPath)).toBe(true);
    expect(readFileSync(clientPath, 'utf8')).toContain('export function createAdminApi');
  });

  it('checks the cookie session against the default CMS service', async () => {
    const {calls, fetcher} = sequenceFetch([
      jsonResponse({authenticated: true, user: {name: '网站维护人', username: 'admin'}, csrfToken: 'csrf-1'})
    ]);
    const api = createAdminApi({fetcher});

    const session = await api.getSession();

    expect(session.authenticated).toBe(true);
    expect(calls[0]).toMatchObject({
      url: 'http://localhost:3111/api/cms/session',
      init: {method: 'GET', credentials: 'include'}
    });
  });

  it('sends the session CSRF token on JSON mutations without setting Origin itself', async () => {
    const {calls, fetcher} = sequenceFetch([
      jsonResponse({authenticated: true, user: {name: '网站维护人', username: 'admin'}, csrfToken: 'csrf-2'}),
      jsonResponse({
        id: 'article-1', title: '新文章', summary: '摘要', body: '正文', category: '公司动态', coverMediaId: 'media-1',
        status: 'draft', updatedAt: '2026-08-29T08:00:00.000Z', publishedAt: null, version: 1
      }, 201)
    ]);
    const api = createAdminApi({baseUrl: 'http://localhost:3100/', fetcher});
    await api.getSession();

    await api.createArticle({title: '新文章', summary: '摘要', body: '正文', category: '公司动态', coverMediaId: 'media-1'});

    expect(calls[1]?.url).toBe('http://localhost:3100/api/cms/articles');
    expect(calls[1]?.init).toMatchObject({method: 'POST', credentials: 'include'});
    const headers = new Headers(calls[1]?.init?.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-CSRF-Token')).toBe('csrf-2');
    expect(headers.has('Origin')).toBe(false);
    expect(JSON.parse(String(calls[1]?.init?.body))).toMatchObject({title: '新文章', coverMediaId: 'media-1'});
  });

  it('uploads the original file bytes with its encoded file name', async () => {
    const {calls, fetcher} = sequenceFetch([
      jsonResponse({authenticated: true, user: {name: '网站维护人', username: 'admin'}, csrfToken: 'csrf-upload'}),
      jsonResponse({id: 'media-2', name: '首屏 图.png', mimeType: 'image/png', size: 3, createdAt: '2026-08-29T08:00:00.000Z', url: '/api/cms/media/media-2/file'}, 201)
    ]);
    const api = createAdminApi({fetcher});
    await api.getSession();
    const file = new File([new Uint8Array([1, 2, 3])], '首屏 图.png', {type: 'image/png'});

    await api.uploadMedia(file);

    expect(calls[1]?.init).toMatchObject({method: 'POST', credentials: 'include', body: file});
    const headers = new Headers(calls[1]?.init?.headers);
    expect(headers.get('Content-Type')).toBe('image/png');
    expect(headers.get('X-File-Name')).toBe(encodeURIComponent('首屏 图.png'));
    expect(headers.get('X-CSRF-Token')).toBe('csrf-upload');
  });

  it('preserves the latest server entity on a 409 conflict', async () => {
    const current = {
      id: 'article-1', title: '服务器版本', summary: '摘要', body: '正文', category: '公司动态', coverMediaId: null,
      status: 'draft', updatedAt: '2026-08-29T08:00:00.000Z', publishedAt: null, version: 3
    };
    const {fetcher} = sequenceFetch([
      jsonResponse({authenticated: true, user: {name: '网站维护人', username: 'admin'}, csrfToken: 'csrf-3'}),
      jsonResponse({error: {code: 'VERSION_CONFLICT', message: '内容已在其他标签页更新', current}}, 409)
    ]);
    const api = createAdminApi({fetcher});
    await api.getSession();

    await expect(api.updateArticle('article-1', {...current, title: '本地版本'})).rejects.toMatchObject({
      status: 409,
      code: 'VERSION_CONFLICT',
      current
    } satisfies {status: number; code: string; current: typeof current});
  });

  it('deletes only the requested draft version with CSRF protection', async () => {
    const {calls, fetcher} = sequenceFetch([
      jsonResponse({authenticated: true, user: {name: '网站维护人', username: 'admin'}, csrfToken: 'csrf-delete'}),
      new Response(null, {status: 204})
    ]);
    const api = createAdminApi({fetcher});
    await api.getSession();

    await api.deleteArticle('draft-1', 7);

    expect(calls[1]?.url).toBe('http://localhost:3111/api/cms/articles/draft-1');
    expect(calls[1]?.init).toMatchObject({method: 'DELETE', credentials: 'include'});
    const headers = new Headers(calls[1]?.init?.headers);
    expect(headers.get('If-Match')).toBe('7');
    expect(headers.get('X-CSRF-Token')).toBe('csrf-delete');
  });

  it('offers deletion only as an explicitly confirmed draft action', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/admin-console.tsx'), 'utf8');

    expect(source).toContain("entity?.status === 'draft' && !entity.published");
    expect(source).toContain('删除草稿');
    expect(source).toContain('window.confirm');
  });

  it('opens the conflict dialog only for version conflicts', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/admin-console.tsx'), 'utf8');

    expect(source).toContain("error.status === 409 && error.code === 'VERSION_CONFLICT' && kind");
  });

  it('renders a real connection state instead of seeded management data', () => {
    const markup = renderToStaticMarkup(createElement(AdminConsole));
    const source = readFileSync(join(process.cwd(), 'src/components/admin-console.tsx'), 'utf8');

    expect(markup).toContain('正在进入内容工作台');
    expect(source).toContain("from '@/lib/admin-api'");
    expect(source).not.toContain('界面原型');
    expect(source).not.toContain('ProductsView');
    expect(source).not.toContain('const mediaAssets');
    expect(source).not.toContain('const articles = [');
    expect(source).toContain('保留当前网站图片');
    expect(source).toContain('恢复原始网站封面');
  });
});
