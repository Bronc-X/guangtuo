import {createFactoryFiles} from '../studio/factory-files';
import {createBufferService} from '../marketing/buffer-service';
import {BufferApiError, type BufferClient} from '../marketing/buffer-client';
import {createSocialResearch, type searchYoutube} from '../marketing/social-research';
import {factoryPackage} from '../studio/factory-package';
import {createMarketingService, MarketingError} from '../marketing/service';
import {createContentAiService, ContentAiError} from '../marketing/content-ai';
import type {ContentAiProvider} from '../marketing/content-ai-provider';
import {createBusinessService, BusinessError} from '../business/service';
import {commercialHtml} from '../business/documents';
import {fetchTrends} from '../marketing/trends';
import {createTranslationPreparer, needsTranslationUpgrade, type PrepareTranslations} from './translation';
import {createHash, randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';
import {existsSync} from 'node:fs';
import {unlink} from 'node:fs/promises';
import {createServer, type IncomingHttpHeaders, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import {homedir} from 'node:os';
import path from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
import {pathToFileURL} from 'node:url';

import {z} from 'zod';

import {
  articleFieldsSchema,
  articlePatchSchema,
  homePatchSchema,
  loginRequestSchema,
  managedContentFieldSchemas,
  managedContentKindSchema,
  publishRequestSchema,
  type ArticleDto,
  type ArticleFields,
  type HomeDto,
  type HomeFields,
  type ManagedContentDto,
  type ManagedContentFieldsByKind,
  type ManagedContentKind,
  type MediaDto,
  type ReleaseDto
} from '../../src/lib/content-admin-contracts';
import {recordAudit} from './audit';
import {
  getArticleRows,
  getDocument,
  getManagedContentRow,
  getManagedContentRows,
  getMedia,
  importPublishedSnapshotIfPristine,
  openContentAdminDatabase,
  parseArticleFields,
  parseHomeFields,
  parseManagedFields,
  type ContentDocumentRow,
  type ManagedContentRow,
  type MediaRow,
  type StoredArticleFields,
  type StoredHomeFields
} from './database';
import {ImageValidationError, readDraftMedia, validateAndStoreMedia} from './media';
import {verifyPassword} from './password';
import {PublishError, publishDocument, publishManagedContent, markInterruptedPublishes, registerDocumentPublish, registerManagedContentPublish, type DeployRelease} from './publisher';
import {createStaticDeployer} from './static-deployer';
import {createInquiryService, type InquiryService, type MailSender} from './inquiries';
import {inquirySchema} from '../../src/lib/contracts';
import {createSmtpSender} from './smtp';
import {createKnowledgeService, type EmbeddingProvider, type KnowledgeService} from '../knowledge/service';
import {createRagService, type GenerationProvider, type RagService} from '../knowledge/rag';
import {createAdvisor} from '../knowledge/advisor';
import {advisorRequest} from '../../src/lib/advisor-contracts';
import {createAiProviders} from '../knowledge/providers';
import {knowledgeLocale, knowledgeMetadata, knowledgeSearch, knowledgeUpdate} from '../../src/lib/knowledge-contracts';
import {createStudioGateway, type StudioGateway} from '../studio/gateway';
import {createStudioBriefs} from '../studio/briefs';
import {studioConceptRequest, studioJobRequest, studioSku} from '../../src/lib/studio-admin-contracts';
import {brandDefaults} from '../../src/data/brand-defaults';

const sessionCookieName = 'cms_session';
const defaultSessionTtlMs = 8 * 60 * 60 * 1000;
const defaultJsonLimit = 1024 * 1024;
const loginWindowMs = 15 * 60 * 1000;
const maxFailedLogins = 5;
const maxLoginAttemptEntries = 10_000;

export type ContentAdminServerOptions = {
  bufferClient?: (key: string) => BufferClient;
  contentAiProvider?: ContentAiProvider;
  socialSearch?: typeof searchYoutube;
  dataDir: string;
  publishedContentPath?: string;
  publicUploadDir?: string;
  allowedOrigin: string;
  secureCookies?: boolean;
  sessionTtlMs?: number;
  maxJsonBytes?: number;
  maxImageBytes?: number;
  maxImageWidth?: number;
  maxImageHeight?: number;
  maxImagePixels?: number;
  now?: () => Date;
  prepareTranslations?: PrepareTranslations;
  deployRelease?: DeployRelease;
  mailSender?: MailSender;
  notificationRecipient?: string;
  trustProxy?: boolean;
  embeddings?: EmbeddingProvider;
  generationProvider?: GenerationProvider;
  studioGateway?: StudioGateway;
};

type ResolvedOptions = Required<Omit<ContentAdminServerOptions, 'bufferClient' | 'socialSearch' | 'contentAiProvider' | 'now' | 'deployRelease' | 'mailSender' | 'notificationRecipient' | 'embeddings' | 'generationProvider' | 'studioGateway'>> & {now: () => Date; deployRelease?: DeployRelease};
type AiServices = {buffer: ReturnType<typeof createBufferService>; factoryFiles: ReturnType<typeof createFactoryFiles>; social: ReturnType<typeof createSocialResearch>; contentAi: ReturnType<typeof createContentAiService>; business: ReturnType<typeof createBusinessService>; marketing: ReturnType<typeof createMarketingService>; advisor: ReturnType<typeof createAdvisor>; knowledge: KnowledgeService; rag: RagService; studio: StudioGateway; briefs: ReturnType<typeof createStudioBriefs>};

type SessionContext = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  csrfToken: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  csrf_token: string;
};

type AdminUserRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
};

type LoginAttempt = {attempts: number; windowStartedAt: number};

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly current?: unknown
  ) {
    super(message);
  }
}

export function createContentAdminServer(input: ContentAdminServerOptions): Server {
  const options: ResolvedOptions = {
    dataDir: input.dataDir,
    prepareTranslations: input.prepareTranslations ?? createTranslationPreparer(input.dataDir),
    deployRelease: input.deployRelease,
    trustProxy: input.trustProxy ?? false,
    publishedContentPath: input.publishedContentPath ?? path.resolve('content/published-content.json'),
    publicUploadDir: input.publicUploadDir ?? path.resolve('public/uploads/cms'),
    allowedOrigin: input.allowedOrigin,
    secureCookies: input.secureCookies ?? process.env.NODE_ENV === 'production',
    sessionTtlMs: input.sessionTtlMs ?? defaultSessionTtlMs,
    maxJsonBytes: input.maxJsonBytes ?? defaultJsonLimit,
    maxImageBytes: input.maxImageBytes ?? 8 * 1024 * 1024,
    maxImageWidth: input.maxImageWidth ?? 6000,
    maxImageHeight: input.maxImageHeight ?? 6000,
    maxImagePixels: input.maxImagePixels ?? 25_000_000,
    now: input.now ?? (() => new Date())
  };
  if (!options.allowedOrigin || new URL(options.allowedOrigin).origin !== options.allowedOrigin) {
    throw new Error('CMS allowed origin must be one exact URL origin');
  }

  const database = openContentAdminDatabase(options.dataDir);
  importPublishedSnapshotIfPristine(database, options.publishedContentPath);
  markInterruptedPublishes(database);
  const configuredAdmin = database.prepare('SELECT id FROM admin_users LIMIT 1').get();
  if (!configuredAdmin) {
    database.close();
    throw new Error('CMS administrator is not configured; run cms:setup first');
  }
  const loginAttempts = new Map<string, LoginAttempt>();
  const knowledge = createKnowledgeService({database, dataDir: options.dataDir, embeddings: input.embeddings, now: () => options.now().getTime()});
  const marketing = createMarketingService(database, options.dataDir);
  const ai: AiServices = {buffer: createBufferService(database, options.dataDir, options.allowedOrigin, marketing, {client: input.bufferClient}), factoryFiles: createFactoryFiles(database, options.dataDir), social: createSocialResearch(database, input.contentAiProvider, input.socialSearch), contentAi: createContentAiService(database, options.dataDir, marketing, input.contentAiProvider), business: createBusinessService(database, {now: options.now}), marketing, advisor: createAdvisor(input.generationProvider), knowledge, rag: createRagService({knowledge, provider: input.generationProvider}), studio: input.studioGateway ?? createStudioGateway({}), briefs: createStudioBriefs(database, knowledge)};
  const inquiries = createInquiryService({database, dataDir: options.dataDir, sender: input.mailSender, notificationRecipient: input.notificationRecipient, adminUrl: `${options.allowedOrigin}/admin/`, now: () => options.now().getTime(), validateGrounding: grounding => knowledge.validateCitations(grounding.citations)});
  const notificationTimer = inquiries.notificationConfigured ? setInterval(() => { void inquiries.flushNotifications().catch(() => process.stderr.write('Notification queue processing failed\n')); }, 15_000) : undefined;
  notificationTimer?.unref();
  let mutationQueue: Promise<void> = Promise.resolve();
  let databaseClosed = false;
  let activePublish: string | null = null;

  const startPublish = (releaseId: string, work: () => Promise<void>) => {
    activePublish = releaseId;
    // Let the 202 response reach the browser before translation or a static build starts.
    setImmediate(() => {
      void work().catch((error: unknown) => {
        process.stderr.write(`CMS publish ${releaseId} failed: ${error instanceof Error ? error.message : 'unknown error'}\n`);
      }).finally(() => { activePublish = null; });
    });
  };

  const server = createServer((request, response) => {
    const dispatch = async () => {
      try {
        await routeRequest(request, response, database, options, loginAttempts, inquiries, ai, {
          current: () => activePublish,
          start: startPublish
        });
      } catch (error) {
        handleError(response, error);
      }
    };
    // Public inquiries are transactionally inserted and must not wait behind a long site build.
    if (isMutation(request.method ?? 'GET') && !request.url?.startsWith('/api/inquiries') && !request.url?.startsWith('/api/advisor')) {
      mutationQueue = mutationQueue.then(dispatch, dispatch);
    } else {
      void dispatch();
    }
  });
  server.on('close', () => {
    clearInterval(notificationTimer);
    inquiries.stopNotifications();
    ai.buffer.stop();
    ai.marketing.stop();
    ai.contentAi.stop();
    ai.social.stop();
    if (!databaseClosed) {
      databaseClosed = true;
      database.close();
    }
  });
  return server;
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  database: DatabaseSync,
  options: ResolvedOptions,
  loginAttempts: Map<string, LoginAttempt>,
  inquiries: InquiryService,
  ai: AiServices,
  publishing: {current: () => string | null; start: (releaseId: string, work: () => Promise<void>) => void}
): Promise<void> {
  const method = request.method ?? 'GET';
  const origin = singleHeader(request.headers, 'origin');
  const originIsRequired = method === 'OPTIONS' || isMutation(method);
  if ((originIsRequired && origin !== options.allowedOrigin) || (origin !== undefined && origin !== options.allowedOrigin)) {
    throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', '请求来源不受允许');
  }
  if (origin === options.allowedOrigin) applyCors(response, options.allowedOrigin);
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, X-File-Name, If-Match, Idempotency-Key, X-Inquiry-Locale, Authorization',
      'Access-Control-Max-Age': '600'
    });
    response.end();
    return;
  }

  const pathname = normalizePath(new URL(request.url ?? '/', 'http://localhost').pathname);
  if (pathname === '/api/health' && method === 'GET') {
    sendJson(response, 200, {status: 'ok'});
    return;
  }
  if (pathname === '/api/advisor' && method === 'POST') {
    const ip = request.socket.remoteAddress ?? '';
    const rateKey = `advisor:${createHash('sha256').update(ip).digest('hex')}`;
    const timestamp = options.now().getTime();
    const rate = loginAttempts.get(rateKey);
    if (rate && timestamp - rate.windowStartedAt < 60_000 && rate.attempts >= 15) throw new ApiError(429, 'RATE_LIMITED', '请稍等片刻再继续');
    if (loginAttempts.size > maxLoginAttemptEntries) loginAttempts.clear();
    loginAttempts.set(rateKey, {attempts: rate && timestamp - rate.windowStartedAt < 60_000 ? rate.attempts + 1 : 1, windowStartedAt: rate && timestamp - rate.windowStartedAt < 60_000 ? rate.windowStartedAt : timestamp});
    const body = await parseJson(request, 1_024_000, advisorRequest);
    try { sendJson(response, 200, await ai.advisor(body)); }
    catch { throw new ApiError(503, 'ADVISOR_UNAVAILABLE', '产品顾问暂时未能回复，您的需求已保留，请重试或填写需求表。'); }
    return;
  }
  if (pathname === '/api/inquiries'  && method === 'POST') {
    const ip = options.trustProxy ? singleHeader(request.headers, 'x-real-ip') ?? request.socket.remoteAddress ?? '' : request.socket.remoteAddress ?? '';
    const rateKey = `inquiry:${createHash('sha256').update(ip).digest('hex')}`;
    const timestamp = options.now().getTime();
    const rate = loginAttempts.get(rateKey);
    if (rate && timestamp - rate.windowStartedAt < 60_000 && rate.attempts >= 5) {
      response.setHeader('Retry-After', '60');
      throw new ApiError(429, 'RATE_LIMITED', '提交过于频繁，请稍后重试');
    }
    if (loginAttempts.size > maxLoginAttemptEntries) loginAttempts.clear();
    loginAttempts.set(rateKey, {attempts: rate && timestamp - rate.windowStartedAt < 60_000 ? rate.attempts + 1 : 1, windowStartedAt: rate && timestamp - rate.windowStartedAt < 60_000 ? rate.windowStartedAt : timestamp});
    const body = await parseJson(request, 1_024_000, inquirySchema);
    const created = await inquiries.create(body, singleHeader(request.headers, 'idempotency-key') ?? '', singleHeader(request.headers, 'x-inquiry-locale') ?? 'en');
    sendJson(response, 202, created);
    return;
  }
  const statusMatch = pathname.match(/^\/api\/inquiries\/([0-9a-f-]{36})\/status$/);
  const previewUploadMatch = pathname.match(/^\/api\/inquiries\/([0-9a-f-]{36})\/preview$/);
  if (previewUploadMatch && method === 'POST') {
    const token = (singleHeader(request.headers, 'authorization') ?? '').replace(/^Bearer /, '');
    if (!inquiries.status(previewUploadMatch[1], token)) throw new ApiError(404, 'NOT_FOUND', '无法找到这条询盘');
    try { sendJson(response, 200, await inquiries.savePreview(previewUploadMatch[1], await readBody(request, 4 * 1024 * 1024))); }
    catch { throw new ApiError(422, 'PREVIEW_INVALID', '方案效果图未保存成功，请重试'); }
    return;
  }
  if (statusMatch && method === 'GET') {
    const token = (singleHeader(request.headers, 'authorization') ?? '').replace(/^Bearer /, '');
    const status = inquiries.status(statusMatch[1], token);
    if (!status) throw new ApiError(404, 'NOT_FOUND', '无法找到这条询盘');
    sendJson(response, 200, status);
    return;
  }
  if (pathname === '/api/cms/auth/login' && method === 'POST') {
    await handleLogin(request, response, database, options, loginAttempts);
    return;
  }
  if (pathname === '/api/cms/session' && method === 'GET') {
    const session = findSession(request, database, options.now());
    if (!session) {
      sendJson(response, 200, {authenticated: false});
      return;
    }
    sendJson(response, 200, sessionResponse(session));
    return;
  }

  const bufferAsset = pathname.match(/^\/api\/marketing\/buffer-media\/([0-9a-f-]{36})\/([0-9a-f]{64})$/);
  if (bufferAsset && (method === 'GET' || method === 'HEAD')) {
    const {bytes,mime} = await ai.buffer.asset(bufferAsset[1],bufferAsset[2]);
    response.setHeader('Content-Type',mime); response.setHeader('Cache-Control','private, no-store'); response.setHeader('X-Content-Type-Options','nosniff'); response.setHeader('Accept-Ranges','bytes');
    const range = singleHeader(request.headers,'range');
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : Math.max(0,bytes.length-Number(match?.[2]));
      const end = match?.[1] && match?.[2] ? Math.min(Number(match[2]),bytes.length-1) : bytes.length-1;
      if(!match || (!match[1]&&!match[2]) || !Number.isSafeInteger(start) || start>end || start>=bytes.length) {response.writeHead(416,{'Content-Range':`bytes */${bytes.length}`});response.end();return;}
      response.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});response.end(method==='HEAD'?undefined:bytes.subarray(start,end+1));return;
    }
    response.writeHead(200,{'Content-Length':bytes.length});response.end(method==='HEAD'?undefined:bytes);return;
  }
  const session = requireSession(request, database, options.now());
  if (isMutation(method)) requireCsrf(request, session);
  if (publishing.current() && isContentMutation(pathname, method)) {
    throw new ApiError(409, 'PUBLISH_IN_PROGRESS', '网站正在发布，请等待当前发布完成后再修改内容。');
  }
  if (pathname === '/api/cms/buffer/connection') {
    if(method==='GET'){sendJson(response,200,ai.buffer.status());return;}
    if(method==='POST'){const result=await ai.buffer.connect(await parseJson(request,4096,z.unknown()));recordAudit(database,'buffer.connected',result.organizationId,{actor:session.username});sendJson(response,200,result);return;}
  }
  if(pathname === '/api/cms/buffer/refresh' && method==='POST') {const body=await parseJson(request,4096,z.object({organizationId:z.string().max(256).optional()}));sendJson(response,200,await ai.buffer.refresh(body.organizationId));return;}
  if(pathname === '/api/cms/buffer/schedules') {
    if(method==='GET'){sendJson(response,200,{items:ai.buffer.list()});return;}
    if(method==='POST'){const result=await ai.buffer.draft(await parseJson(request,8192,z.unknown()),session.username);recordAudit(database,'buffer.draft',result.id,{actor:session.username});sendJson(response,201,result);return;}
  }
  const bufferSchedule = pathname.match(/^\/api\/cms\/buffer\/schedules\/([0-9a-f-]{36})\/(submit|sync|cancel)$/);
  if(bufferSchedule && method==='POST') {
    const [,id,action]=bufferSchedule;
    const result=action==='submit'?await ai.buffer.submit(id,await parseJson(request,4096,z.unknown())):action==='sync'?await ai.buffer.sync(id):await ai.buffer.cancel(id);
    recordAudit(database,`buffer.${action}`,id,{actor:session.username});sendJson(response,200,result);return;
  }
  if (pathname === '/api/cms/social-research') {
    if (method === 'GET') {sendJson(response, 200, {items: ai.social.list()}); return;}
    if (method === 'POST') {sendJson(response, 202, ai.social.create(await parseJson(request, 4096, z.unknown()), session.username)); return;}
  }
  const socialMatch = pathname.match(/^\/api\/cms\/social-research\/([0-9a-f-]{36})(?:\/(analyze))?$/);
  if (socialMatch) {
    const [,id,action] = socialMatch;
    if (!action && method === 'GET') {sendJson(response, 200, ai.social.get(id)); return;}
    if (action === 'analyze' && method === 'POST') {sendJson(response, 202, ai.social.analyze(id, session.username)); return;}
  }
  if (pathname === '/api/cms/content-ai/status' && method === 'GET') {sendJson(response, 200, ai.contentAi.status()); return;}
  if (['/api/cms/content-ai/source', '/api/cms/content-ai/import-image'].includes(pathname) && method === 'POST') {
    const body = await parseJson(request, 8192, z.object({url: z.url().max(4096)}));
    sendJson(response, 200, pathname.endsWith('/source') ? await ai.contentAi.source(body.url) : await ai.contentAi.importImage(body.url)); return;
  }
  if (pathname === '/api/cms/content-ai/jobs') {
    if (method === 'GET') {sendJson(response, 200, {items: ai.contentAi.list()}); return;}
    if (method === 'POST') {sendJson(response, 201, ai.contentAi.create(await parseJson(request, 150000, z.unknown()), session.username)); return;}
  }
  const contentAiMatch = pathname.match(/^\/api\/cms\/content-ai\/jobs\/([0-9a-f-]{36})(?:\/(plan|write|image|adopt))?$/);
  if (contentAiMatch) {
    const [, id, action] = contentAiMatch;
    if (!action && method === 'GET') {sendJson(response, 200, ai.contentAi.get(id)); return;}
    if (!action && method === 'PATCH') {sendJson(response, 200, ai.contentAi.update(id, await parseJson(request, 300000, z.unknown()))); return;}
    if (action && method === 'POST') {
      const {version} = await parseJson(request, 1024, z.object({version: z.number().int().positive()}));
      sendJson(response, action === 'adopt' ? 200 : 202, action === 'adopt' ? ai.contentAi.adopt(id, version, session.username) : ai.contentAi.start(id, version, action as 'plan' | 'write' | 'image', session.username)); return;
    }
  }
  if (pathname === '/api/cms/business/status' && method === 'GET') {sendJson(response, 200, ai.business.status()); return;}
  if (pathname === '/api/cms/business/opportunities') {
    if (method === 'GET') {sendJson(response, 200, {items: ai.business.list()}); return;}
    if (method === 'POST') {sendJson(response, 201, ai.business.create(await parseJson(request, 65536, z.unknown()))); return;}
  }
  const businessSync = pathname.match(/^\/api\/cms\/business\/(website|chatwoot|tikhub|import)$/);
  if (businessSync && method === 'POST') {
    const body = await parseJson(request, 600000, z.unknown());
    const result = businessSync[1] === 'website' ? ai.business.syncWebsite() : businessSync[1] === 'chatwoot' ? await ai.business.syncChatwoot(body) : businessSync[1] === 'tikhub' ? await ai.business.syncTikHub(body) : ai.business.importCsv(body);
    sendJson(response, 200, result); return;
  }
  const opportunityMatch = pathname.match(/^\/api\/cms\/business\/opportunities\/([0-9a-f-]{36})$/);
  if (opportunityMatch) {
    if (method === 'GET') {sendJson(response, 200, ai.business.get(opportunityMatch[1])); return;}
    if (method === 'PATCH') {sendJson(response, 200, ai.business.update(opportunityMatch[1], await parseJson(request, 65536, z.unknown()))); return;}
  }
  if (pathname === '/api/cms/business/documents') {
    if (method === 'GET') {sendJson(response, 200, {items: ai.business.listDocuments()}); return;}
    if (method === 'POST') {sendJson(response, 201, ai.business.createDocument(await parseJson(request, 4096, z.unknown()))); return;}
  }
  const commercialMatch = pathname.match(/^\/api\/cms\/business\/documents\/([0-9a-f-]{36})(?:\/(review|export))?$/);
  if (commercialMatch) {
    const [, id, action] = commercialMatch;
    if (!action && method === 'GET') {sendJson(response, 200, ai.business.getDocument(id)); return;}
    if (!action && method === 'PATCH') {sendJson(response, 200, ai.business.updateDocument(id, await parseJson(request, 500000, z.unknown()))); return;}
    if (action === 'review' && method === 'POST') {sendJson(response, 200, ai.business.reviewDocument(id, await parseJson(request, 2048, z.unknown()))); return;}
    if (action === 'export' && method === 'GET') {
      const doc = ai.business.getDocument(id);
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${doc.number}.html"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox"});
      response.end(commercialHtml(doc)); return;
    }
  }
  if (pathname === '/api/cms/marketing/status' && method === 'GET') {sendJson(response, 200, await ai.marketing.status()); return;}
  if (pathname === '/api/cms/marketing/trends' && method === 'POST') {
    const input = await parseJson(request, 8192, z.object({query: z.string().trim().min(2).max(160), language: z.enum(['zh', 'en'])}));
    try {sendJson(response, 200, await fetchTrends(input.query, input.language));}
    catch {throw new MarketingError(502, '新闻线索暂时无法读取，请重试；也可直接输入主题。');} return;
  }
  if (pathname === '/api/cms/marketing/campaigns/manual' && method==='POST') {const campaign=ai.marketing.createManual(await parseJson(request,32000,z.unknown()));recordAudit(database,'marketing.manual',campaign.id,{actor:session.username});sendJson(response,201,campaign);return;}
  if (pathname === '/api/cms/marketing/campaigns') {
    if (method === 'GET') {sendJson(response, 200, {items: ai.marketing.list()}); return;}
    if (method === 'POST') {sendJson(response, 201, ai.marketing.create(await parseJson(request, 16384, z.unknown()))); return;}
  }
  const marketingMatch = pathname.match(/^\/api\/cms\/marketing\/campaigns\/([0-9a-f-]{36})(?:\/(video|publish|export))?$/);
  if (marketingMatch) {
    const [, id, action] = marketingMatch;
    if (!action && method === 'GET') {sendJson(response, 200, ai.marketing.get(id)); return;}
    if (!action && method === 'PATCH') {sendJson(response, 200, ai.marketing.update(id, await parseJson(request, 65536, z.unknown()))); return;}
    if (action === 'video' && method === 'POST') {const input = await parseJson(request, 2048, z.object({version: z.number().int().positive()})); sendJson(response, 202, ai.marketing.render(id, input.version)); return;}
    if (action === 'video' && method === 'GET') {const bytes = await ai.marketing.video(id); response.writeHead(200, {'Content-Type': 'video/mp4', 'Content-Length': bytes.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}); response.end(bytes); return;}
    if (action === 'publish' && method === 'POST') {sendJson(response, 202, await ai.marketing.publish(id, await parseJson(request, 8192, z.unknown()))); return;}
    if (action === 'export' && method === 'GET') {const campaign = ai.marketing.get(id); response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="marketing-' + id + '.json"', 'Cache-Control': 'no-store'}); response.end(JSON.stringify(campaign, null, 2)); return;}
  }
  const factoryFileMatch = pathname.match(/^\/api\/cms\/inquiries\/([0-9a-f-]{36})\/factory-files(?:\/([0-9a-f-]{36}))?$/);
  if (factoryFileMatch) {
    const [,id,fileId] = factoryFileMatch;
    if (!inquiries.get(id)?.input.design) throw new ApiError(404, 'NOT_FOUND', '设计方案不存在');
    if (!fileId && method === 'GET') {sendJson(response, 200, {items: ai.factoryFiles.list(id)}); return;}
    if (!fileId && method === 'POST') {
      const name = decodeFileName(singleHeader(request.headers, 'x-file-name'));
      const file = await ai.factoryFiles.upload(id, name, await readBody(request, 20_000_000));
      recordAudit(database, 'studio.file.upload', id, {actor: session.username, fileId: file.id});
      sendJson(response, 201, file); return;
    }
    if (fileId && method === 'GET') {
      const file = await ai.factoryFiles.read(id, fileId);
      response.writeHead(200, {'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="design-file"; filename*=UTF-8''${encodeURIComponent(file.name)}`,'Content-Length':file.bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      response.end(file.bytes); return;
    }
    if (fileId && method === 'DELETE') {
      await ai.factoryFiles.remove(id,fileId); recordAudit(database, 'studio.file.remove', id, {actor:session.username,fileId}); sendJson(response,200,{removed:true}); return;
    }
  }
  const inquiryAction = pathname.match(/^\/api\/cms\/inquiries\/([0-9a-f-]{36})\/(read|preview|retry-notification|factory-package)$/);
  if (inquiryAction) {
    const [, id, action] = inquiryAction;
    if (action === 'factory-package' && method === 'GET') {
      const record = inquiries.get(id);
      if (!record?.input.design) throw new ApiError(404, 'NOT_FOUND', '此询盘没有设计方案');
      const bytes = await factoryPackage(record, inquiries.readPreview(id), ai.studio, path.resolve('public'), await Promise.all(ai.factoryFiles.list(id).map(file => ai.factoryFiles.read(id, file.id))));
      recordAudit(database, 'studio.factory-package', id, {actor: session.username});
      response.writeHead(200, {'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="factory-design-${id}.zip"`, 'Content-Length': bytes.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
      response.end(bytes); return;
    }
    if (action === 'read' && method === 'POST') { sendJson(response, 200, inquiries.markRead(id)); return; }
    if (action === 'retry-notification' && method === 'POST') { sendJson(response, 200, inquiries.retryNotification(id)); return; }
    if (action === 'preview' && method === 'GET') {
      const bytes = inquiries.readPreview(id);
      if (!bytes) throw new ApiError(404, 'NOT_FOUND', '尚未保存效果图');
      response.writeHead(200, {'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}); response.end(bytes); return;
    }
  }

  if (pathname === '/api/cms/ai/status' && method === 'GET') {
    sendJson(response, 200, {ragConfigured: ai.rag.configured, embeddingConfigured: ai.knowledge.embeddingConfigured, smtpConfigured: inquiries.configured, studioConfigured: ai.studio.configured, studioGenerationEnabled: ai.studio.generationEnabled}); return;
  }
  if (pathname === '/api/cms/knowledge' && method === 'GET') {
    sendJson(response, 200, {items: ai.knowledge.list()}); return;
  }
  if (pathname === '/api/cms/knowledge/documents' && method === 'POST') {
    const body = await parseJson(request, options.maxJsonBytes, knowledgeMetadata.extend({text: z.string().trim().min(1).max(500_000)}));
    const doc = await ai.knowledge.ingest({...body, fileName: 'document.txt', bytes: Buffer.from(body.text)}, session.userId);
    if (doc.parseState !== 'ready') throw new ApiError(422, 'DOCUMENT_PARSE_FAILED', '资料解析失败，原件已保留；请查看解析状态', doc);
    sendJson(response, 201, doc); return;
  }
  if (pathname === '/api/cms/knowledge/uploads' && method === 'POST') {
    const query = new URL(request.url!, 'http://localhost').searchParams;
    const metadata = knowledgeMetadata.parse({title: query.get('title'), locale: query.get('locale'), skus: query.getAll('sku')});
    const fileName = decodeFileName(singleHeader(request.headers, 'x-file-name'));
    const doc = await ai.knowledge.ingest({...metadata, fileName, bytes: await readBody(request, 8 * 1024 * 1024)}, session.userId);
    if (doc.parseState !== 'ready') throw new ApiError(422, 'DOCUMENT_PARSE_FAILED', '资料解析失败，原件已保留；扫描件需要 OCR 后重新上传', doc);
    sendJson(response, 201, doc); return;
  }
  if (pathname === '/api/cms/knowledge/search' && method === 'POST') {
    const {confirmed, ...body} = await parseJson(request, 16_384, knowledgeSearch.extend({confirmed: z.boolean().optional()}));
    if (body.mode === 'hybrid' && confirmed !== true) throw new Error('EXTERNAL_PROCESSING_CONFIRMATION_REQUIRED');
    sendJson(response, 200, await ai.knowledge.search(body)); return;
  }
  const knowledgeMatch = pathname.match(/^\/api\/cms\/knowledge\/documents\/([0-9a-f-]{36})(?:\/(file|embeddings|contents))?$/);
  if (knowledgeMatch) {
    const [, id, action] = knowledgeMatch;
    if (action === 'contents' && method === 'GET') { sendJson(response, 200, ai.knowledge.contents(id)); return; }
    if (!action && method === 'GET') { sendJson(response, 200, ai.knowledge.get(id)); return; }
    if (!action && method === 'PATCH') {
      const {version, ...patch} = await parseJson(request, 16_384, knowledgeUpdate.extend({version: z.number().int().positive()}));
      sendJson(response, 200, ai.knowledge.update(id, version, patch, session.userId)); return;
    }
    if (action === 'embeddings' && method === 'POST') {
      const body = await parseJson(request, 1024, z.strictObject({version: z.number().int().positive(), confirmed: z.boolean()}));
      sendJson(response, 200, await ai.knowledge.indexDocument(id, body.version, body.confirmed, session.userId)); return;
    }
    if (action === 'file' && method === 'GET') {
      const file = await ai.knowledge.original(id);
      response.writeHead(200, {'Content-Type': 'application/octet-stream', 'Content-Length': String(file.bytes.length), 'Content-Disposition': `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
      response.end(file.bytes); return;
    }
  }
  if (pathname === '/api/cms/studio/status' && method === 'GET') { sendJson(response, 200, await ai.studio.health()); return; }
  if (pathname === '/api/cms/studio/briefs' && method === 'POST') {
    const body = await parseJson(request, 16_384, z.strictObject({query: z.string().min(1).max(2000), sku: studioSku, locale: knowledgeLocale, mode: z.enum(['bm25', 'hybrid']), confirmed: z.boolean()}));
    sendJson(response, 201, ai.briefs.save(body.sku, await ai.rag.generate({...body, kind: 'studio'}), session.userId)); return;
  }
  if (pathname === '/api/cms/studio/concept-images' && method === 'POST') {
    const {briefId, ...body} = await parseJson(request, 16_384, studioConceptRequest.extend({briefId: z.string().uuid().optional()}));
    if (briefId) ai.briefs.validate(briefId, body.sku, body.prompt);
    sendJson(response, 201, await ai.studio.concept(body)); return;
  }
  if (pathname === '/api/cms/studio/jobs' && method === 'POST') {
    const body = await parseJson(request, 16_384, studioJobRequest);
    sendJson(response, 202, await ai.studio.createJob(body)); return;
  }
  const studioMatch = pathname.match(/^\/api\/cms\/studio\/(concept-images|jobs)\/([0-9a-f]{32})(\/model)?$/);
  if (studioMatch && method === 'GET') {
    const [, kind, id, model] = studioMatch;
    if (kind === 'jobs' && !model) { sendJson(response, 200, await ai.studio.getJob(id)); return; }
    if (kind === 'concept-images' && model) throw new ApiError(404, 'NOT_FOUND', '文件不存在');
    const asset = await ai.studio.asset(kind as 'jobs' | 'concept-images', id);
    response.writeHead(200, {'Content-Type': asset.contentType, 'Content-Length': String(asset.bytes.length), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
    response.end(asset.bytes); return;
  }

  if (pathname === '/api/cms/inquiries' && method === 'GET') {
    sendJson(response, 200, {items: inquiries.list(), smtpConfigured: inquiries.configured, ragConfigured: ai.rag.configured, embeddingConfigured: ai.knowledge.embeddingConfigured});
    return;
  }
  const inquiryMatch = pathname.match(/^\/api\/cms\/inquiries\/([0-9a-f-]{36})(?:\/(approve|send|generate|template))?$/);
  if (inquiryMatch) {
    const [, id, action] = inquiryMatch;
    if (action === 'template' && method === 'POST') {
      const body = await parseJson(request, 1024, z.strictObject({version: z.number().int().positive()}));
      sendJson(response, 200, inquiries.generateTemplate(id, body.version, session.userId)); return;
    }
    if (action === 'generate' && method === 'POST') {
      const body = await parseJson(request, 1024, z.strictObject({version: z.number().int().positive(), mode: z.enum(['bm25', 'hybrid']), confirmed: z.boolean()}));
      const record = inquiries.get(id);
      if (!record) throw new Error('INQUIRY_NOT_FOUND');
      if (record.version !== body.version) throw new Error('VERSION_CONFLICT');
      if (['sent', 'queued'].includes(record.email.status)) throw new Error('EMAIL_LOCKED');
      const {sku, productGoal, configuration, packagingPreference, certificationConstraints, market} = record.input;
      const query = JSON.stringify({sku, productGoal, configuration, packagingPreference, certificationConstraints, market}).slice(0, 2000);
      const requirements = Object.fromEntries(Object.entries(record.input).filter(([key]) => !['name', 'businessEmail', 'contact', 'company', 'privacyConsent'].includes(key)));
      const draft = await ai.rag.generate({kind: 'mail', query, context: JSON.stringify(requirements), sku, locale: record.locale, mode: body.mode, confirmed: body.confirmed});
      sendJson(response, 200, inquiries.applyGenerated(id, body.version, draft, session.userId)); return;
    }
    if (!action && method === 'GET') {
      const record = inquiries.get(id);
      if (!record) throw new ApiError(404, 'NOT_FOUND', '询盘不存在');
      sendJson(response, 200, record);
      return;
    }
    if (!action && method === 'PATCH') {
      const body = await parseJson(request, 32_768, z.strictObject({version: z.number().int().positive(), subject: z.string(), body: z.string()}));
      sendJson(response, 200, inquiries.edit(id, body.version, {subject: body.subject, body: body.body}, session.userId));
      return;
    }
    if (action === 'approve' && method === 'POST') {
      const body = await parseJson(request, 1024, z.strictObject({version: z.number().int().positive(), confirmed: z.literal(true)}));
      sendJson(response, 200, inquiries.approve(id, body.version, session.userId, body.confirmed));
      return;
    }
    if (action === 'send' && method === 'POST') {
      await parseJson(request, 1024, z.strictObject({}));
      sendJson(response, 200, await inquiries.send(id, session.userId));
      return;
    }
  }

  if (pathname === '/api/cms/auth/logout' && method === 'POST') {
    database.prepare('DELETE FROM admin_sessions WHERE id = ?').run(session.id);
    recordAudit(database, 'auth.logout', session.userId, {result: 'success'}, options.now().toISOString());
    response.setHeader('Set-Cookie', clearSessionCookie(options.secureCookies));
    response.writeHead(204);
    response.end();
    return;
  }

  if (pathname === '/api/cms/home') {
    if (method === 'GET') {
      sendJson(response, 200, toHomeDto(requiredDocument(database, 'home')));
      return;
    }
    if (method === 'PATCH') {
      const body = await parseJson(request, options.maxJsonBytes, homePatchSchema);
      if (body.heroMediaId) requireMedia(database, body.heroMediaId);
      const current = requiredDocument(database, 'home');
      if (body.version !== current.version) throw versionConflict(toHomeDto(current));
      const existing = parseHomeFields(current.draft_json);
      const draft: StoredHomeFields = {
        textStyles: body.textStyles ?? existing.textStyles,
        heroTitle: body.heroTitle,
        heroBody: body.heroBody,
        heroMediaId: body.heroMediaId,
        legacyHeroImage: existing.legacyHeroImage
      };
      const now = options.now().toISOString();
      const result = database.prepare(`
        UPDATE content_documents SET draft_json = ?, version = version + 1, updated_at = ?
        WHERE id = 'home' AND version = ?
      `).run(JSON.stringify(draft), now, current.version);
      if (Number(result.changes) !== 1) throw versionConflict(toHomeDto(requiredDocument(database, 'home')));
      const updated = requiredDocument(database, 'home');
      recordAudit(database, 'home.save', 'home', {result: 'success', version: updated.version}, now);
      sendJson(response, 200, toHomeDto(updated));
      return;
    }
  }

  if (pathname === '/api/cms/home/publish' && method === 'POST') {
    const body = await parseJson(request, options.maxJsonBytes, publishRequestSchema);
    const current = requiredDocument(database, 'home');
    if (body.version !== current.version) throw versionConflict(toHomeDto(current));
    if (current.published_version !== current.version || needsTranslationUpgrade(options.publishedContentPath)) {
      const now = options.now().toISOString();
      const releaseId = registerDocumentPublish(database, current, now);
      publishing.start(releaseId, () => publishDocument({...options, database, document: current, now, releaseId}));
      sendJson(response, 202, {releaseId, status: 'building'});
      return;
    }
    sendJson(response, 200, toHomeDto(requiredDocument(database, 'home')));
    return;
  }

  if (pathname === '/api/cms/articles') {
    if (method === 'GET') {
      sendJson(response, 200, {items: getArticleRows(database).map(toArticleDto)});
      return;
    }
    if (method === 'POST') {
      const body = await parseJson(request, options.maxJsonBytes, articleFieldsSchema);
      if (body.coverMediaId) requireMedia(database, body.coverMediaId);
      const now = options.now().toISOString();
      const id = randomUUID();
      const slug = `article-${id.replaceAll('-', '').slice(0, 12)}`;
      const draft: StoredArticleFields = {...body, legacyCover: ''};
      database.prepare(`
        INSERT INTO content_documents (
          id, kind, slug, draft_json, published_json, version, published_version, created_at, updated_at, published_at
        ) VALUES (?, 'article', ?, ?, NULL, 1, NULL, ?, ?, NULL)
      `).run(id, slug, JSON.stringify(draft), now, now);
      recordAudit(database, 'article.create', id, {result: 'success', version: 1}, now);
      sendJson(response, 201, toArticleDto(requiredDocument(database, id)));
      return;
    }
  }

  const articleMatch = pathname.match(/^\/api\/cms\/articles\/([a-zA-Z0-9._-]{1,120})$/);
  if (articleMatch) {
    const id = articleMatch[1];
    if (method === 'GET') {
      sendJson(response, 200, toArticleDto(requiredArticle(database, id)));
      return;
    }
    if (method === 'PATCH') {
      const body = await parseJson(request, options.maxJsonBytes, articlePatchSchema);
      if (body.coverMediaId) requireMedia(database, body.coverMediaId);
      const current = requiredArticle(database, id);
      if (body.version !== current.version) throw versionConflict(toArticleDto(current));
      const existing = parseArticleFields(current.draft_json);
      const draft: StoredArticleFields = {
        textStyles: body.textStyles ?? existing.textStyles,
        title: body.title,
        summary: body.summary,
        body: body.body,
        category: body.category,
        coverMediaId: body.coverMediaId,
        legacyCover: existing.legacyCover
      };
      const now = options.now().toISOString();
      const result = database.prepare(`
        UPDATE content_documents SET draft_json = ?, version = version + 1, updated_at = ?
        WHERE id = ? AND kind = 'article' AND version = ?
      `).run(JSON.stringify(draft), now, id, current.version);
      if (Number(result.changes) !== 1) throw versionConflict(toArticleDto(requiredArticle(database, id)));
      const updated = requiredArticle(database, id);
      recordAudit(database, 'article.save', id, {result: 'success', version: updated.version}, now);
      sendJson(response, 200, toArticleDto(updated));
      return;
    }
    if (method === 'DELETE') {
      const current = requiredArticle(database, id);
      const expectedVersion = Number(singleHeader(request.headers, 'if-match'));
      if (!Number.isInteger(expectedVersion)) throw new ApiError(400, 'INVALID_VERSION', 'If-Match 必须提供当前版本号');
      if (expectedVersion !== current.version) throw versionConflict(toArticleDto(current));
      if (current.published_json) {
        throw new ApiError(409, 'PUBLISHED_ARTICLE_CANNOT_BE_DELETED', '已发布文章不能直接删除', toArticleDto(current));
      }
      database.prepare("DELETE FROM content_documents WHERE id = ? AND kind = 'article'").run(id);
      recordAudit(database, 'article.delete', id, {result: 'success', version: current.version}, options.now().toISOString());
      response.writeHead(204);
      response.end();
      return;
    }
  }

  const articlePublishMatch = pathname.match(/^\/api\/cms\/articles\/([a-zA-Z0-9._-]{1,120})\/publish$/);
  if (articlePublishMatch && method === 'POST') {
    const id = articlePublishMatch[1];
    const body = await parseJson(request, options.maxJsonBytes, publishRequestSchema);
    const current = requiredArticle(database, id);
    if (body.version !== current.version) throw versionConflict(toArticleDto(current));
    if (current.published_version !== current.version || needsTranslationUpgrade(options.publishedContentPath)) {
      const now = options.now().toISOString();
      const releaseId = registerDocumentPublish(database, current, now);
      publishing.start(releaseId, () => publishDocument({...options, database, document: current, now, releaseId}));
      sendJson(response, 202, {releaseId, status: 'building'});
      return;
    }
    sendJson(response, 200, toArticleDto(requiredArticle(database, id)));
    return;
  }

  const managedCollectionMatch = pathname.match(/^\/api\/cms\/content\/(pages|products|formats|credentials)$/);
  if (managedCollectionMatch && method === 'GET') {
    const kind = managedContentKindSchema.parse(managedCollectionMatch[1]);
    sendJson(response, 200, {items: getManagedContentRows(database, kind).map(toManagedContentDto)});
    return;
  }

  const managedPublishMatch = pathname.match(/^\/api\/cms\/content\/(pages|products|formats|credentials)\/([a-zA-Z0-9._-]{1,120})\/publish$/);
  if (managedPublishMatch && method === 'POST') {
    const kind = managedContentKindSchema.parse(managedPublishMatch[1]);
    const id = managedPublishMatch[2];
    const body = await parseJson(request, options.maxJsonBytes, publishRequestSchema);
    const current = requiredManagedContent(database, kind, id);
    if (body.version !== current.version) throw versionConflict(toManagedContentDto(current));
    if (current.published_version !== current.version || needsTranslationUpgrade(options.publishedContentPath)) {
      const now = options.now().toISOString();
      const releaseId = registerManagedContentPublish(database, current, now);
      publishing.start(releaseId, () => publishManagedContent({...options, database, record: current, now, releaseId}));
      sendJson(response, 202, {releaseId, status: 'building'});
      return;
    }
    sendJson(response, 200, toManagedContentDto(requiredManagedContent(database, kind, id)));
    return;
  }

  const managedItemMatch = pathname.match(/^\/api\/cms\/content\/(pages|products|formats|credentials)\/([a-zA-Z0-9._-]{1,120})$/);
  if (managedItemMatch && method === 'PATCH') {
    const kind = managedContentKindSchema.parse(managedItemMatch[1]);
    const id = managedItemMatch[2];
    const body = await parseJson(request, options.maxJsonBytes, z.strictObject({
      version: z.number().int().nonnegative(),
      fields: z.unknown()
    }));
    const fields = managedContentFieldSchemas[kind].parse(body.fields) as ManagedContentFieldsByKind[typeof kind];
    if ('imageMediaId' in fields && fields.imageMediaId) requireMedia(database, fields.imageMediaId);
    for (const [key, value] of Object.entries(fields)) {
      if (['wechatQrMediaId', 'whatsappQrMediaId', 'tiktokQrMediaId'].includes(key) && typeof value === 'string' && value) requireMedia(database, value);
    }
    if ('pdfMediaId' in fields && fields.pdfMediaId) requireMedia(database, fields.pdfMediaId, 'pdf');
    const current = requiredManagedContent(database, kind, id);
    if (body.version !== current.version) throw versionConflict(toManagedContentDto(current));
    const existing = parseManagedFields(current.draft_json);
    const draft = {
      ...fields,
      ...('legacyPdf' in existing && !('pdfMediaId' in fields) ? {legacyPdf: existing.legacyPdf} : {}),
      ...('legacyImage' in existing ? {legacyImage: existing.legacyImage} : {})
    };
    const now = options.now().toISOString();
    const result = database.prepare(`
      UPDATE managed_content_records
      SET draft_json = ?, label = ?, version = version + 1, updated_at = ?
      WHERE record_key = ? AND version = ?
    `).run(JSON.stringify(draft), managedRecordLabel(kind, fields, current.label), now, current.record_key, current.version);
    if (Number(result.changes) !== 1) throw versionConflict(toManagedContentDto(requiredManagedContent(database, kind, id)));
    const updated = requiredManagedContent(database, kind, id);
    recordAudit(database, `${kind}.save`, id, {result: 'success', version: updated.version}, now);
    sendJson(response, 200, toManagedContentDto(updated));
    return;
  }

  if (pathname === '/api/cms/media') {
    if (method === 'GET') {
      const rows = database.prepare('SELECT * FROM media_assets ORDER BY created_at DESC, id DESC').all() as MediaRow[];
      sendJson(response, 200, {items: rows.map(toMediaDto)});
      return;
    }
    if (method === 'POST') {
      const fileName = decodeFileName(singleHeader(request.headers, 'x-file-name'));
      const bytes = await readBody(request, options.maxImageBytes);
      const now = options.now().toISOString();
      let stored: MediaRow | undefined;
      try {
        stored = await validateAndStoreMedia({
          bytes,
          fileName,
          dataDir: options.dataDir,
          limits: {
            maxImageBytes: options.maxImageBytes,
            maxImageWidth: options.maxImageWidth,
            maxImageHeight: options.maxImageHeight,
            maxImagePixels: options.maxImagePixels
          },
          now
        });
        database.prepare(`
          INSERT INTO media_assets (id, original_name, storage_key, mime_type, size_bytes, width, height, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(stored.id, stored.original_name, stored.storage_key, stored.mime_type, stored.size_bytes, stored.width, stored.height, stored.created_at);
      } catch (error) {
        if (stored) await unlink(path.join(options.dataDir, 'draft-media', stored.storage_key)).catch(() => undefined);
        throw error;
      }
      recordAudit(database, 'media.upload', stored.id, {result: 'success', size: stored.size_bytes}, now);
      sendJson(response, 201, toMediaDto(stored));
      return;
    }
  }

  const mediaMatch = pathname.match(/^\/api\/cms\/media\/([0-9a-f-]{36})$/);
  if (mediaMatch && method === 'DELETE') {
    const media = requireMedia(database, mediaMatch[1], 'any');
    if (mediaReferenceCount(database, media.id) > 0) {
      throw new ApiError(409, 'MEDIA_IN_USE', '文件正在被网站内容使用，请先在对应内容中替换后再删除');
    }
    database.prepare('DELETE FROM media_assets WHERE id = ?').run(media.id);
    await Promise.all([
      unlink(path.join(options.dataDir, 'draft-media', media.storage_key)).catch(() => undefined),
      unlink(path.join(options.publicUploadDir, media.storage_key)).catch(() => undefined)
    ]);
    recordAudit(database, 'media.delete', media.id, {result: 'success'}, options.now().toISOString());
    response.writeHead(204);
    response.end();
    return;
  }

  const mediaFileMatch = pathname.match(/^\/api\/cms\/media\/([0-9a-f-]{36})\/file$/);
  if (mediaFileMatch && method === 'GET') {
    const media = requireMedia(database, mediaFileMatch[1], 'any');
    let bytes: Buffer;
    try {
      bytes = await readDraftMedia(options.dataDir, media);
    } catch {
      throw new ApiError(404, 'MEDIA_NOT_FOUND', '图片不存在');
    }
    response.writeHead(200, {
      'Content-Type': media.mime_type,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'private, no-store',
      ...(media.mime_type === 'application/pdf' ? {'Content-Disposition': `attachment; filename="${media.storage_key}"`, 'Content-Security-Policy': "sandbox; default-src 'none'"} : {}),
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(bytes);
    return;
  }

  if (pathname === '/api/cms/releases' && method === 'GET') {
    const documentRows = database.prepare(`
      SELECT id, kind, title, status, message, published_at
      FROM releases ORDER BY published_at DESC, id DESC
    `).all() as Array<{id: string; kind: ReleaseDto['kind']; title: string; status: 'building' | 'live' | 'failed'; message: string | null; published_at: string}>;
    const managedRows = database.prepare(`
      SELECT id, kind, title, status, message, published_at
      FROM managed_content_releases ORDER BY published_at DESC, id DESC
    `).all() as Array<{id: string; kind: ReleaseDto['kind']; title: string; status: 'building' | 'live' | 'failed'; message: string | null; published_at: string}>;
    const rows = [...documentRows, ...managedRows].sort((left, right) => right.published_at.localeCompare(left.published_at));
    const items: ReleaseDto[] = rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      status: row.status,
      publishedAt: row.published_at,
      ...(row.message ? {message: row.message} : {})
    }));
    sendJson(response, 200, {items});
    return;
  }

  throw new ApiError(404, 'NOT_FOUND', '接口不存在');
}

async function handleLogin(
  request: IncomingMessage,
  response: ServerResponse,
  database: DatabaseSync,
  options: ResolvedOptions,
  attempts: Map<string, LoginAttempt>
): Promise<void> {
  const body = await parseJson(request, options.maxJsonBytes, loginRequestSchema);
  const username = body.username.toLowerCase();
  const remoteAddress = request.socket.remoteAddress ?? 'unknown';
  const key = remoteAddress;
  const nowDate = options.now();
  const nowMs = nowDate.getTime();
  pruneLoginAttempts(attempts, key, nowMs);
  const attempt = attempts.get(key);
  if (attempt && nowMs - attempt.windowStartedAt < loginWindowMs && attempt.attempts >= maxFailedLogins) {
    throw new ApiError(429, 'LOGIN_RATE_LIMITED', '登录尝试过多，请稍后再试');
  }

  const configuredUser = database.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as AdminUserRow | undefined;
  // Keep password verification work for unknown usernames without authenticating the fallback user.
  const passwordRecord = configuredUser ?? database.prepare('SELECT password_hash FROM admin_users LIMIT 1').get() as Pick<AdminUserRow, 'password_hash'> | undefined;
  const passwordMatches = passwordRecord ? await verifyPassword(body.password, passwordRecord.password_hash) : false;
  const usernameMatches = configuredUser?.username === username;
  if (!configuredUser || !passwordMatches || !usernameMatches) {
    const current = attempts.get(key);
    attempts.set(key, current ? {...current, attempts: current.attempts + 1} : {attempts: 1, windowStartedAt: nowMs});
    recordAudit(database, 'auth.login', configuredUser?.id ?? null, {result: 'failure', reason: 'invalid_credentials'}, nowDate.toISOString());
    throw new ApiError(401, 'INVALID_CREDENTIALS', '用户名或密码错误');
  }
  attempts.delete(key);

  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');
  const sessionId = randomUUID();
  const expiresAt = new Date(nowMs + options.sessionTtlMs).toISOString();
  database.prepare(`
    INSERT INTO admin_sessions (id, user_id, token_hash, csrf_token, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sessionId, configuredUser.id, hashToken(token), csrfToken, nowDate.toISOString(), expiresAt);
  recordAudit(database, 'auth.login', configuredUser.id, {result: 'success'}, nowDate.toISOString());

  response.setHeader('Set-Cookie', sessionCookie(token, options));
  sendJson(response, 200, {
    authenticated: true,
    user: {name: configuredUser.display_name, username: configuredUser.username},
    csrfToken
  });
}

function pruneLoginAttempts(attempts: Map<string, LoginAttempt>, incomingKey: string, nowMs: number): void {
  for (const [key, attempt] of attempts) {
    if (nowMs - attempt.windowStartedAt >= loginWindowMs) attempts.delete(key);
  }
  while (!attempts.has(incomingKey) && attempts.size >= maxLoginAttemptEntries) {
    const oldestKey = attempts.keys().next().value;
    if (oldestKey === undefined) break;
    attempts.delete(oldestKey);
  }
}

function findSession(request: IncomingMessage, database: DatabaseSync, now: Date): SessionContext | undefined {
  database.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(now.toISOString());
  const rawToken = parseCookies(singleHeader(request.headers, 'cookie'))[sessionCookieName];
  if (!rawToken) return undefined;
  const row = database.prepare(`
    SELECT sessions.id, sessions.user_id, sessions.csrf_token, users.username, users.display_name
    FROM admin_sessions AS sessions
    JOIN admin_users AS users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(rawToken), now.toISOString()) as SessionRow | undefined;
  return row ? {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    csrfToken: row.csrf_token
  } : undefined;
}

function requireSession(request: IncomingMessage, database: DatabaseSync, now: Date): SessionContext {
  const session = findSession(request, database, now);
  if (!session) throw new ApiError(401, 'UNAUTHENTICATED', '请先登录');
  return session;
}

function requireCsrf(request: IncomingMessage, session: SessionContext): void {
  const candidate = singleHeader(request.headers, 'x-csrf-token');
  if (!candidate || !safeEqual(candidate, session.csrfToken)) {
    throw new ApiError(403, 'INVALID_CSRF_TOKEN', '页面验证信息已失效，请刷新后重试');
  }
}

function toHomeDto(row: ContentDocumentRow): HomeDto {
  const storedDraft = parseHomeFields(row.draft_json);
  const draft = publicHomeFields(storedDraft);
  const published = row.published_json ? publicHomeFields(parseHomeFields(row.published_json)) : null;
  return {
    id: 'home',
    heroImage: storedDraft.legacyHeroImage,
    ...draft,
    version: row.version,
    status: row.published_version === row.version ? 'published' : 'draft',
    updatedAt: row.updated_at,
    ...(row.published_at ? {publishedAt: row.published_at} : {}),
    published
  };
}

function toArticleDto(row: ContentDocumentRow): ArticleDto {
  const storedDraft = parseArticleFields(row.draft_json);
  const draft = publicArticleFields(storedDraft);
  const published = row.published_json ? publicArticleFields(parseArticleFields(row.published_json)) : null;
  return {
    id: row.id,
    slug: row.slug,
    cover: storedDraft.legacyCover,
    ...draft,
    version: row.version,
    status: row.published_version === row.version ? 'published' : 'draft',
    updatedAt: row.updated_at,
    ...(row.published_at ? {publishedAt: row.published_at} : {}),
    published
  };
}

function publicHomeFields(fields: StoredHomeFields): HomeFields {
  return {textStyles: fields.textStyles, heroTitle: fields.heroTitle, heroBody: fields.heroBody, heroMediaId: fields.heroMediaId};
}

function publicArticleFields(fields: StoredArticleFields): ArticleFields {
  return {
    textStyles: fields.textStyles,
    title: fields.title,
    summary: fields.summary,
    body: fields.body,
    category: fields.category,
    coverMediaId: fields.coverMediaId
  };
}

function toMediaDto(row: MediaRow): MediaDto {
  return {
    id: row.id,
    name: row.original_name,
    mimeType: row.mime_type,
    size: row.size_bytes,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
    url: `/api/cms/media/${row.id}/file`
  };
}

function mediaReferenceCount(database: DatabaseSync, mediaId: string): number {
  const content = database.prepare(`
    SELECT COUNT(*) AS count
    FROM content_documents
    WHERE instr(draft_json, ?) > 0 OR instr(COALESCE(published_json, ''), ?) > 0
  `).get(mediaId, mediaId) as {count: number};
  const managed = database.prepare(`
    SELECT COUNT(*) AS count
    FROM managed_content_records
    WHERE instr(draft_json, ?) > 0 OR instr(COALESCE(published_json, ''), ?) > 0
  `).get(mediaId, mediaId) as {count: number};
  const marketing = database.prepare('SELECT COUNT(*) AS count FROM marketing_campaigns WHERE instr(payload, ?) > 0').get(mediaId) as {count: number};
  const contentAi = database.prepare('SELECT COUNT(*) AS count FROM content_ai_jobs WHERE instr(payload, ?) > 0').get(mediaId) as {count: number};
  return Number(content.count) + Number(managed.count) + Number(marketing.count) + Number(contentAi.count);
}

function toManagedContentDto(row: ManagedContentRow): ManagedContentDto {
  const storedDraft = {...(row.kind === 'pages' && row.id === 'about' ? brandDefaults : {}), ...parseManagedFields(row.draft_json)};
  const fields = publicManagedFields(row.kind, storedDraft);
  const published = row.published_json ? publicManagedFields(row.kind, parseManagedFields(row.published_json)) : null;
  const mediaId = 'imageMediaId' in storedDraft ? storedDraft.imageMediaId : null;
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    fields,
    image: mediaId ? `/api/cms/media/${mediaId}/file` : ('legacyImage' in storedDraft ? storedDraft.legacyImage ?? '' : ''),
    version: row.version,
    status: row.published_version === row.version ? 'published' : 'draft',
    updatedAt: row.updated_at,
    ...(row.published_at ? {publishedAt: row.published_at} : {}),
    published
  } as ManagedContentDto;
}

function publicManagedFields<Kind extends ManagedContentKind>(
  kind: Kind,
  fields: ManagedContentFieldsByKind[Kind] & {legacyImage?: string}
): ManagedContentFieldsByKind[Kind] {
  const publicFields = {...fields} as Record<string, unknown>;
  delete publicFields.legacyImage;
  delete publicFields.legacyPdf;
  return managedContentFieldSchemas[kind].parse(publicFields) as ManagedContentFieldsByKind[Kind];
}

function managedRecordLabel(kind: ManagedContentKind, fields: ManagedContentFieldsByKind[ManagedContentKind], fallback: string): string {
  if (kind === 'products' || kind === 'formats') return 'name' in fields && fields.name.trim() ? fields.name.trim() : fallback;
  if (kind === 'credentials') return 'title' in fields && fields.title.trim() ? fields.title.trim() : fallback;
  return fallback;
}

function requiredDocument(database: DatabaseSync, id: string): ContentDocumentRow {
  const row = getDocument(database, id);
  if (!row) throw new ApiError(404, 'NOT_FOUND', '内容不存在');
  return row;
}

function requiredArticle(database: DatabaseSync, id: string): ContentDocumentRow {
  const row = requiredDocument(database, id);
  if (row.kind !== 'article') throw new ApiError(404, 'NOT_FOUND', '文章不存在');
  return row;
}

function requiredManagedContent(database: DatabaseSync, kind: ManagedContentKind, id: string): ManagedContentRow {
  const row = getManagedContentRow(database, kind, id);
  if (!row) throw new ApiError(404, 'NOT_FOUND', '内容不存在');
  return row;
}

function requireMedia(database: DatabaseSync, id: string, kind: 'image' | 'pdf' | 'any' = 'image'): MediaRow {
  const media = getMedia(database, id);
  if (!media) throw new ApiError(400, 'MEDIA_NOT_FOUND', '所选图片不存在');
  if ((kind === 'image' && !media.mime_type.startsWith('image/')) || (kind === 'pdf' && media.mime_type !== 'application/pdf')) {
    throw new ApiError(400, 'MEDIA_TYPE_MISMATCH', '所选文件类型不适用于此字段');
  }
  return media;
}

async function parseJson<T>(request: IncomingMessage, limit: number, schema: z.ZodType<T>): Promise<T> {
  const contentType = singleHeader(request.headers, 'content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new ApiError(415, 'JSON_REQUIRED', '请求必须使用 application/json');
  const bytes = await readBody(request, limit);
  let input: unknown;
  try {
    input = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new ApiError(400, 'INVALID_JSON', '请求 JSON 无法解析');
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'INVALID_REQUEST', '请求字段不完整或格式错误');
  return parsed.data;
}

async function readBody(request: IncomingMessage, limit: number): Promise<Buffer> {
  const rawLength = singleHeader(request.headers, 'content-length');
  if (rawLength && Number(rawLength) > limit) throw new ApiError(413, 'REQUEST_TOO_LARGE', '上传内容超过允许大小');
  const chunks: Buffer[] = [];
  let total = 0;
  let exceeded = false;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limit) exceeded = true;
    else chunks.push(buffer);
  }
  if (exceeded) throw new ApiError(413, 'REQUEST_TOO_LARGE', '上传内容超过允许大小');
  return Buffer.concat(chunks, total);
}

function decodeFileName(value: string | undefined): string {
  if (!value) throw new ApiError(400, 'FILE_NAME_REQUIRED', '缺少 X-File-Name');
  let decoded: string;
  try {
    decoded = decodeURIComponent(value).normalize('NFC');
  } catch {
    throw new ApiError(400, 'INVALID_FILE_NAME', '文件名编码无效');
  }
  if (
    !decoded || decoded.length > 200 || decoded.includes('\0') ||
    path.posix.basename(decoded) !== decoded || path.win32.basename(decoded) !== decoded
  ) {
    throw new ApiError(400, 'INVALID_FILE_NAME', '文件名无效');
  }
  return decoded;
}

function singleHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(';').map((part) => {
    const separator = part.indexOf('=');
    return separator === -1 ? [part.trim(), ''] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }));
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function versionConflict(current: HomeDto | ArticleDto | ManagedContentDto): ApiError {
  return new ApiError(409, 'VERSION_CONFLICT', '内容已在其他页面被更新，请刷新后重试', current);
}

function sessionResponse(session: SessionContext) {
  return {
    authenticated: true,
    user: {name: session.displayName, username: session.username},
    csrfToken: session.csrfToken
  };
}

function sessionCookie(token: string, options: ResolvedOptions): string {
  const maxAge = Math.floor(options.sessionTtlMs / 1000);
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${options.secureCookies ? '; Secure' : ''}`;
}

function clearSessionCookie(secure: boolean): string {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function isMutation(method: string): boolean {
  return method === 'POST' || method === 'PATCH' || method === 'DELETE' || method === 'PUT';
}

function isContentMutation(pathname: string, method: string): boolean {
  return isMutation(method) && (
    /^\/api\/cms\/(home|articles|content)(\/|$)/.test(pathname) ||
    (method === 'DELETE' && pathname.startsWith('/api/cms/media/'))
  );
}

function applyCors(response: ServerResponse, origin: string): void {
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Vary', 'Origin');
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.headersSent) return;
  const serialized = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(Buffer.byteLength(serialized)),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(serialized);
}

function handleError(response: ServerResponse, error: unknown): void {
  if (error instanceof ContentAiError) {sendJson(response, error.status, {error: {code: 'CONTENT_AI_ERROR', message: error.message}}); return;}
  if (error instanceof BusinessError) {sendJson(response, error.status, {error: {code: 'BUSINESS_ERROR', message: error.message}}); return;}
  if (error instanceof BufferApiError) {sendJson(response,502,{error:{code:'BUFFER_ERROR',message:error.message}});return;}
  if (error instanceof MarketingError) {sendJson(response, error.status, {error: {code: 'MARKETING_ERROR', message: error.message}}); return;}
  if (response.headersSent) {
    response.end();
    return;
  }
  const inquiryErrors: Record<string, [number, string]> = {
    DOCUMENT_NOT_FOUND: [404, '资料不存在'],
    INVALID_FILE_NAME: [400, '文件名不正确'],
    DOCUMENT_TOO_LARGE: [413, '文件超过 8 MB 上限'],
    DOCUMENT_NOT_PARSED: [409, '资料尚未成功解析，不能启用或建立索引'],
    DOCUMENT_REVIEW_REQUIRED: [409, '请确认资料已审核且允许对客使用'],
    KNOWLEDGE_CAPACITY_EXCEEDED: [409, '资料库达到当前容量上限，请归档或联系管理员调整索引'],
    EXTERNAL_PROCESSING_CONFIRMATION_REQUIRED: [400, '请确认允许将相关内容交给外部服务处理，可能产生费用'],
    EMBEDDINGS_NOT_CONFIGURED: [503, '向量服务未配置，可选择 BM25 检索'],
    VECTOR_INDEX_INCOMPLETE: [409, '相关资料的向量索引尚未建立，请先建立索引或选择 BM25'],
    INVALID_EMBEDDING_RESPONSE: [502, '向量服务返回的数据无效'],
    VECTOR_DIMENSION_MISMATCH: [409, '向量维度不匹配，请核对模型并重建索引'],
    RAG_NOT_CONFIGURED: [503, '文本生成服务未配置'],
    NO_RELEVANT_EVIDENCE: [422, '没有找到相关的已审核对客资料，请先录入并启用资料'],
    RAG_INVALID_OUTPUT: [502, '生成内容未通过格式检查，未保存草稿'],
    RAG_INVALID_CITATION: [502, '生成内容引用无法核对，未保存草稿'],
    RAG_SOURCES_STALE: [409, '引用资料已变更或停用，请重新生成并审核'],
    STUDIO_NOT_CONFIGURED: [503, '3D 网关未配置'],
    STUDIO_GENERATION_DISABLED: [503, '3D 生成尚未启用，需先确认服务费用与模型许可'],
    STUDIO_BRIEF_NOT_FOUND: [404, '设计简报不存在'],
    STUDIO_BRIEF_MISMATCH: [409, '设计简报与当前产品或提示不一致'],
    STUDIO_BRIEF_CAPACITY_EXCEEDED: [409, '设计简报已达到保存上限'],
    STUDIO_INVALID_ASSET: [502, '3D 网关返回的文件格式不正确'],
    INVALID_REQUEST: [400, '请求格式不正确，请检查后重试'],
    IDEMPOTENCY_CONFLICT: [409, '此提交编号已用于其他内容，请刷新表单后重试'],
    VERSION_CONFLICT: [409, '内容已更新，请刷新列表并重新确认'],
    INQUIRY_NOT_FOUND: [404, '询盘不存在'],
    REVIEW_CONFIRMATION_REQUIRED: [400, '请先核对邮件内容并确认'],
    EMAIL_NOT_APPROVED: [409, '当前邮件版本尚未确认，不能发送'],
    EMAIL_RECIPIENT_REQUIRED: [422, '客户未留邮箱，请使用其微信或 WhatsApp 联系'],
    EMAIL_NOT_PENDING_REVIEW: [409, '邮件已确认或正在发送，请刷新查看'],
    EMAIL_LOCKED: [409, '正在发送或已发送的邮件不能修改'],
    EMAIL_RETRY_LIMIT: [409, '已达到重试上限，请核查发件服务后再处理']
  };
  // Only known error codes are returned. Never echo upstream bodies, credentials or internal URLs.
  for (const prefix of ['AI', 'STUDIO']) {
    for (const [suffix, status, message] of [
      ['AUTH_FAILED', 503, '外部服务鉴权失败，请核对服务端凭据'], ['RATE_LIMITED', 429, '外部服务限流，请稍后重试'],
      ['TIMEOUT', 504, '外部服务超时；生成结果可能未知，请核查服务记录，不要连续重试'],
      ['UPSTREAM_FAILED', 502, '外部服务调用失败；如涉及生成，请核查服务记录后再重试'],
      ['UNAVAILABLE', 503, '外部服务尚未就绪，请核查配置和运行状态'], ['INVALID_RESPONSE', 502, '外部服务返回的数据无效'],
      ['RESPONSE_REJECTED', 502, '模型拒绝回答或输出不完整，未保存草稿'], ['RESPONSE_TOO_LARGE', 502, '外部服务返回数据过大'],
      ['NOT_FOUND', 404, '外部服务中的资源不存在'], ['NOT_READY', 409, '生成文件尚未就绪']
    ] as const) inquiryErrors[`${prefix}_${suffix}`] = [status, message];
  }
  if (error instanceof Error && inquiryErrors[error.message]) {
    const [status, message] = inquiryErrors[error.message];
    sendJson(response, status, {error: {code: error.message, message}});
    return;
  }
  if (error instanceof z.ZodError) {
    sendJson(response, 400, {error: {code: 'INVALID_REQUEST', message: '提交字段未通过检查'}});
    return;
  }
  if (error instanceof ApiError || error instanceof PublishError || error instanceof ImageValidationError) {
    sendJson(response, error.status, {
      error: {
        code: error.code,
        message: error.message,
        ...('current' in error && error.current !== undefined ? {current: error.current} : {})
      }
    });
    return;
  }
  sendJson(response, 500, {error: {code: 'INTERNAL_ERROR', message: '服务器暂时无法处理请求'}});
}

const invokedFile = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedFile) {
  if (existsSync('.env.development.local')) process.loadEnvFile('.env.development.local');
  const ai = createAiProviders();
  const dataDir = process.env.CMS_DATA_DIR ?? path.join(homedir(), '.guangtuo-cms');
  const allowedOrigin = process.env.CMS_ALLOWED_ORIGIN ?? 'http://localhost:3000';
  const server = createContentAdminServer({
    dataDir,
    allowedOrigin,
    deployRelease: process.env.CMS_DEPLOY_ROOT ? createStaticDeployer({projectDir: process.env.CMS_PROJECT_DIR ?? process.cwd(), dataDir, siteRoot: process.env.CMS_DEPLOY_ROOT}) : undefined,
    mailSender: createSmtpSender(),
    notificationRecipient: process.env.NOTIFICATION_EMAIL,
    embeddings: ai.embeddings,
    generationProvider: ai.generator,
    studioGateway: createStudioGateway(),
    trustProxy: process.env.CMS_TRUST_PROXY === 'true',
    publishedContentPath: process.env.CMS_PUBLISHED_CONTENT_PATH ?? path.resolve('content/published-content.json'),
    publicUploadDir: process.env.CMS_PUBLIC_UPLOAD_DIR ?? path.resolve('public/uploads/cms')
  });
  const configuredPort = Number(process.env.CMS_PORT ?? '3111');
  if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65_535) {
    throw new Error('CMS_PORT must be an integer between 1 and 65535');
  }
  server.listen(configuredPort, '127.0.0.1', () => {
    process.stdout.write(`Guangtuo CMS API listening on http://127.0.0.1:${configuredPort}\n`);
  });
}
