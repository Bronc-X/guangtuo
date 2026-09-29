import type {BufferConnection, BufferDraft, BufferSchedule} from './buffer-contracts';
import type {FactoryFile} from './factory-file-contracts';
import type {SocialResearch} from './social-research-contracts';
import type {MarketingManual, MarketingBrief, MarketingCampaign, MarketingCopy, MarketingPlatform, MarketingStatus, MarketingTrend} from './marketing-contracts';
import type {ContentAiBrief, ContentAiJob, ContentAiPrompts, ContentAiSource, ContentAiStatus} from './content-ai-contracts';
import type {BusinessStatus, Opportunity, OpportunityFields, CommercialDocument, CommercialFields, ImportResult} from './business-contracts';
import type {
  ArticleDto,
  ArticleFields as CmsArticleFields,
  HomeDto,
  HomeFields,
  ManagedContentDto,
  ManagedContentFieldsByKind,
  ManagedContentKind,
  MediaDto,
  ReleaseDto
} from '@/lib/content-admin-contracts';
import type {StoredInquiry} from './inquiry-admin-contracts';
import type {z} from 'zod';
import type {knowledgeMetadata, knowledgeSearch, knowledgeUpdate, KnowledgeDocument, KnowledgeSearchResult, Grounding} from './knowledge-contracts';
import type {studioConceptRequest, studioJobRequest, StudioConcept, StudioJob} from './studio-admin-contracts';

export type CmsUser = {
  name: string;
  username: string;
};

export type CmsSession =
  | {authenticated: false}
  | {authenticated: true; user: CmsUser; csrfToken: string};

export type Article = ArticleDto;
export type ArticleFields = CmsArticleFields;
export type ArticleUpdate = ArticleFields & {version: number};
export type HomeContent = HomeDto;
export type HomeUpdate = HomeFields & {version: number};
export type MediaAsset = MediaDto;
export type Release = ReleaseDto;
export type PublishTicket = {releaseId: string; status: 'building'};
export type ManagedContent<Kind extends ManagedContentKind = ManagedContentKind> = ManagedContentDto<Kind>;
export type {ManagedContentFieldsByKind, ManagedContentKind};

type Collection<Item> = {items: Item[]};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    current?: unknown;
  };
};

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly current?: unknown;

  constructor(status: number, code: string, message: string, current?: unknown) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
    this.current = current;
  }
}

type ApiOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

const DEFAULT_CMS_API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3111';

export function createAdminApi(options: ApiOptions = {}) {
  const baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_CMS_API_URL ?? DEFAULT_CMS_API_URL).replace(/\/+$/, '');
  const fetcher = options.fetcher ?? fetch;
  let csrfToken = '';

  async function request<ResponseBody>(path: string, init: RequestInit = {}, requiresCsrf = false): Promise<ResponseBody> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (requiresCsrf) {
      if (!csrfToken) throw new AdminApiError(403, 'CSRF_TOKEN_MISSING', '登录状态已失效，请重新登录。');
      headers.set('X-CSRF-Token', csrfToken);
    }

    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${path}`, {...init, credentials: 'include', headers});
    } catch {
      throw new AdminApiError(0, 'NETWORK_ERROR', '无法连接内容服务，请确认后台服务已启动。');
    }

    const payload = await readPayload(response);
    if (!response.ok) {
      const apiError = (payload ?? {}) as ApiErrorPayload;
      throw new AdminApiError(
        response.status,
        apiError.error?.code ?? `HTTP_${response.status}`,
        apiError.error?.message ?? fallbackMessage(response.status),
        apiError.error?.current
      );
    }
    return payload as ResponseBody;
  }

  async function jsonMutation<ResponseBody>(path: string, method: 'POST' | 'PATCH', body: unknown, requiresCsrf = true) {
    return request<ResponseBody>(path, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    }, requiresCsrf);
  }

  async function waitForRelease(releaseId: string): Promise<Release> {
    const deadline = Date.now() + 47 * 60_000;
    let connectionFailures = 0;
    while (Date.now() < deadline) {
      try {
        const releases = (await request<Collection<Release>>('/api/cms/releases', {
          method: 'GET',
          signal: AbortSignal.timeout(10_000)
        })).items;
        connectionFailures = 0;
        const release = releases.find((item) => item.id === releaseId);
        if (release?.status === 'live') return release;
        if (release?.status === 'failed') throw new AdminApiError(500, 'PUBLISH_FAILED', release.message ?? '发布失败，草稿已保留。');
      } catch (error) {
        if (error instanceof AdminApiError && error.code === 'PUBLISH_FAILED') throw error;
        if (error instanceof AdminApiError && error.status === 401) throw error;
        if (++connectionFailures >= 3) {
          throw new AdminApiError(0, 'PUBLISH_STATUS_UNKNOWN', '暂时无法确认发布结果。请稍后查看发布记录，避免重复发布。');
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    throw new AdminApiError(0, 'PUBLISH_STATUS_UNKNOWN', '发布仍未完成。请查看发布记录确认结果。');
  }

  return {
    socialResearchList: () => request<{items:SocialResearch[]}>('/api/cms/social-research'),
    socialResearchGet: (id:string) => request<SocialResearch>(`/api/cms/social-research/${id}`),
    socialResearchCreate: (input:{query:string;kind:'article'|'marketing';language:'zh'|'en'}) => jsonMutation<SocialResearch>('/api/cms/social-research','POST',input),
    socialResearchAnalyze: (id:string) => jsonMutation<SocialResearch>(`/api/cms/social-research/${id}/analyze`,'POST',{}),
    factoryFiles: (id:string) => request<{items:FactoryFile[]}>(`/api/cms/inquiries/${id}/factory-files`),
    factoryFileUpload: (id:string,file:File) => request<FactoryFile>(`/api/cms/inquiries/${id}/factory-files`,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file},true),
    factoryFileRemove: (id:string,fileId:string) => request<{removed:boolean}>(`/api/cms/inquiries/${id}/factory-files/${fileId}`,{method:'DELETE'},true),
    factoryPackage: async (id:string) => {
      const response=await fetcher(`${baseUrl}/api/cms/inquiries/${id}/factory-package`,{credentials:'include'});
      if(!response.ok)throw new Error('资料包下载失败，请检查登录状态并重试');
      return response.blob();
    },
    contentAiStatus: () => request<ContentAiStatus>('/api/cms/content-ai/status'),
    contentAiSource: (url: string) => jsonMutation<ContentAiSource>('/api/cms/content-ai/source', 'POST', {url}),
    contentAiImportImage: (url: string) => jsonMutation<{mediaId: string}>('/api/cms/content-ai/import-image', 'POST', {url}),
    contentAiList: () => request<{items: ContentAiJob[]}>('/api/cms/content-ai/jobs'),
    contentAiCreate: (brief: ContentAiBrief) => jsonMutation<ContentAiJob>('/api/cms/content-ai/jobs', 'POST', brief),
    contentAiGet: (id: string) => request<ContentAiJob>('/api/cms/content-ai/jobs/' + id),
    contentAiSave: (id: string, version: number, prompts: ContentAiPrompts, output?: ContentAiJob['output']) => jsonMutation<ContentAiJob>('/api/cms/content-ai/jobs/' + id, 'PATCH', {version, prompts, output}),
    contentAiStep: (id: string, version: number, step: 'plan' | 'write' | 'image' | 'adopt') => jsonMutation<ContentAiJob>('/api/cms/content-ai/jobs/' + id + '/' + step, 'POST', {version}),
    businessStatus: () => request<BusinessStatus>('/api/cms/business/status'),
    businessList: () => request<{items: Opportunity[]}>('/api/cms/business/opportunities'),
    businessCreate: (fields: OpportunityFields) => jsonMutation<Opportunity>('/api/cms/business/opportunities', 'POST', fields),
    businessSave: (item: Opportunity) => jsonMutation<Opportunity>('/api/cms/business/opportunities/' + item.id, 'PATCH', item),
    businessSync: (source: 'website' | 'chatwoot' | 'tikhub' | 'import', input: unknown = {}) => jsonMutation<ImportResult>('/api/cms/business/' + source, 'POST', input),
    commercialList: () => request<{items: CommercialDocument[]}>('/api/cms/business/documents'),
    commercialCreate: (opportunityId: string, kind: CommercialDocument['kind'], fromDocumentId?: string) => jsonMutation<CommercialDocument>('/api/cms/business/documents', 'POST', {opportunityId, kind, fromDocumentId}),
    commercialSave: (id: string, fields: CommercialFields & {version: number}) => jsonMutation<CommercialDocument>('/api/cms/business/documents/' + id, 'PATCH', fields),
    commercialReview: (id: string, version: number) => jsonMutation<CommercialDocument>('/api/cms/business/documents/' + id + '/review', 'POST', {version}),
    bufferConnection: () => request<BufferConnection>('/api/cms/buffer/connection'),
    bufferConnect: (key:string) => jsonMutation<BufferConnection>('/api/cms/buffer/connection','POST',{key}),
    bufferRefresh: (organizationId?:string) => jsonMutation<BufferConnection>('/api/cms/buffer/refresh','POST',{organizationId}),
    bufferList: () => request<{items:BufferSchedule[]}>('/api/cms/buffer/schedules'),
    bufferDraft: (input:BufferDraft) => jsonMutation<BufferSchedule>('/api/cms/buffer/schedules','POST',input),
    bufferSubmit: (id:string,channelId:string) => jsonMutation<BufferSchedule>(`/api/cms/buffer/schedules/${id}/submit`,'POST',{channelId,confirmed:true}),
    bufferSync: (id:string) => jsonMutation<BufferSchedule>(`/api/cms/buffer/schedules/${id}/sync`,'POST',{}),
    bufferCancel: (id:string) => jsonMutation<BufferSchedule>(`/api/cms/buffer/schedules/${id}/cancel`,'POST',{}),
    marketingManual: (input:MarketingManual) => jsonMutation<MarketingCampaign>('/api/cms/marketing/campaigns/manual','POST',input),
    marketingStatus: () => request<MarketingStatus>('/api/cms/marketing/status'),
    marketingTrends: (query: string, language: 'zh' | 'en') => jsonMutation<{items: MarketingTrend[]; fetchedAt: string; source: string}>('/api/cms/marketing/trends', 'POST', {query, language}),
    marketingList: () => request<{items: MarketingCampaign[]}>('/api/cms/marketing/campaigns'),
    marketingGet: (id: string) => request<MarketingCampaign>('/api/cms/marketing/campaigns/' + id),
    marketingCreate: (brief: MarketingBrief) => jsonMutation<MarketingCampaign>('/api/cms/marketing/campaigns', 'POST', brief),
    marketingSave: (id: string, version: number, copy: MarketingCopy) => jsonMutation<MarketingCampaign>('/api/cms/marketing/campaigns/' + id, 'PATCH', {version, copy}),
    marketingVideo: (id: string, version: number) => jsonMutation<MarketingCampaign>('/api/cms/marketing/campaigns/' + id + '/video', 'POST', {version}),
    marketingPublish: (id: string, version: number, platforms: MarketingPlatform[], visibility: 'public' | 'private') => jsonMutation<MarketingCampaign>('/api/cms/marketing/campaigns/' + id + '/publish', 'POST', {version, platforms, visibility, confirmed: true}),
    listInquiries: () => request<{items: StoredInquiry[]; smtpConfigured: boolean; ragConfigured: boolean; embeddingConfigured: boolean}>('/api/cms/inquiries', {method: 'GET'}),
    markInquiryRead: (id: string) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${id}/read`, 'POST', {}),
    generateInquiryTemplate: (record: StoredInquiry) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${record.id}/template`, 'POST', {version: record.version}),
    retryInquiryNotification: (id: string) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${id}/retry-notification`, 'POST', {}),
    generateInquiryEmail: (record: StoredInquiry, mode: 'bm25' | 'hybrid', confirmed: boolean) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${record.id}/generate`, 'POST', {version: record.version, mode, confirmed}),
    updateInquiryEmail: (record: StoredInquiry, fields: {subject: string; body: string}) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${record.id}`, 'PATCH', {version: record.version, ...fields}),
    approveInquiryEmail: (record: StoredInquiry) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${record.id}/approve`, 'POST', {version: record.version, confirmed: true}),
    sendInquiryEmail: (id: string) => jsonMutation<StoredInquiry>(`/api/cms/inquiries/${id}/send`, 'POST', {}),
    getAiStatus: () => request<{ragConfigured: boolean; embeddingConfigured: boolean; smtpConfigured: boolean; studioConfigured: boolean; studioGenerationEnabled: boolean}>('/api/cms/ai/status'),
    listKnowledge: () => request<Collection<KnowledgeDocument>>('/api/cms/knowledge'),
    knowledgeContents: (id: string) => request<{document: KnowledgeDocument; chunks: Array<{location: string; text: string}>}>(`/api/cms/knowledge/documents/${id}/contents`),
    createKnowledgeText: (data: z.input<typeof knowledgeMetadata> & {text: string}) => jsonMutation<KnowledgeDocument>('/api/cms/knowledge/documents', 'POST', data),
    uploadKnowledge: (file: File, metadata: z.input<typeof knowledgeMetadata>) => {
      const query = new URLSearchParams({title: metadata.title, locale: metadata.locale});
      for (const sku of metadata.skus ?? []) query.append('sku', sku);
      return request<KnowledgeDocument>(`/api/cms/knowledge/uploads?${query}`, {method: 'POST', headers: {'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name)}, body: file}, true);
    },
    updateKnowledge: (doc: KnowledgeDocument, patch: z.input<typeof knowledgeUpdate>) => jsonMutation<KnowledgeDocument>(`/api/cms/knowledge/documents/${doc.id}`, 'PATCH', {version: doc.version, ...patch}),
    indexKnowledge: (doc: KnowledgeDocument, confirmed: boolean) => jsonMutation<{indexed: number; profile: string; cached: boolean}>(`/api/cms/knowledge/documents/${doc.id}/embeddings`, 'POST', {version: doc.version, confirmed}),
    searchKnowledge: (query: z.input<typeof knowledgeSearch> & {confirmed?: boolean}) => jsonMutation<KnowledgeSearchResult>('/api/cms/knowledge/search', 'POST', query),
    getStudioStatus: () => request<{ready: boolean; image_ready: boolean; model_ready: boolean; busy: boolean; estimated_wait_seconds: number}>('/api/cms/studio/status'),
    generateStudioBrief: (data: {sku: string; query: string; locale: string; mode: 'bm25' | 'hybrid'; confirmed: boolean}) => jsonMutation<{id: string; sku: string; title: string; body: string; grounding: Grounding}>('/api/cms/studio/briefs', 'POST', data),
    createStudioConcept: (data: z.input<typeof studioConceptRequest> & {briefId?: string}) => jsonMutation<StudioConcept>('/api/cms/studio/concept-images', 'POST', data),
    createStudioJob: (data: z.input<typeof studioJobRequest>) => jsonMutation<StudioJob>('/api/cms/studio/jobs', 'POST', data),
    getStudioJob: (id: string) => request<StudioJob>(`/api/cms/studio/jobs/${encodeURIComponent(id)}`),
    resolveUrl(path: string): string {
      if (/^https?:\/\//i.test(path)) return path;
      return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    },

    async getSession(): Promise<CmsSession> {
      const session = await request<CmsSession>('/api/cms/session', {method: 'GET'});
      csrfToken = session.authenticated ? session.csrfToken : '';
      return session;
    },

    async login(credentials: {username: string; password: string}): Promise<Extract<CmsSession, {authenticated: true}>> {
      const session = await jsonMutation<Extract<CmsSession, {authenticated: true}>>('/api/cms/auth/login', 'POST', credentials, false);
      csrfToken = session.csrfToken;
      return session;
    },

    async logout(): Promise<void> {
      await jsonMutation<void>('/api/cms/auth/logout', 'POST', {});
      csrfToken = '';
    },

    getHome: () => request<HomeContent>('/api/cms/home', {method: 'GET'}),
    updateHome: (home: HomeUpdate) => jsonMutation<HomeContent>('/api/cms/home', 'PATCH', home),
    publishHome: (version: number) => jsonMutation<HomeContent | PublishTicket>('/api/cms/home/publish', 'POST', {version}),

    async listArticles(): Promise<Article[]> {
      return (await request<Collection<Article>>('/api/cms/articles', {method: 'GET'})).items;
    },
    createArticle: (article: ArticleFields) => jsonMutation<Article>('/api/cms/articles', 'POST', article),
    updateArticle: (id: string, article: ArticleUpdate) => jsonMutation<Article>(`/api/cms/articles/${encodeURIComponent(id)}`, 'PATCH', article),
    deleteArticle: (id: string, version: number) => request<void>(`/api/cms/articles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {'If-Match': String(version)}
    }, true),
    publishArticle: (id: string, version: number) => jsonMutation<Article | PublishTicket>(`/api/cms/articles/${encodeURIComponent(id)}/publish`, 'POST', {version}),

    async listMedia(): Promise<MediaAsset[]> {
      return (await request<Collection<MediaAsset>>('/api/cms/media', {method: 'GET'})).items;
    },
    uploadMedia: (file: File) => request<MediaAsset>('/api/cms/media', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name)
      },
      body: file
    }, true),
    deleteMedia: (id: string) => request<void>(`/api/cms/media/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }, true),

    async listManagedContent<Kind extends ManagedContentKind>(kind: Kind): Promise<Array<ManagedContent<Kind>>> {
      return (await request<Collection<ManagedContent<Kind>>>(`/api/cms/content/${kind}`, {method: 'GET'})).items;
    },
    updateManagedContent: <Kind extends ManagedContentKind>(
      kind: Kind,
      id: string,
      version: number,
      fields: ManagedContentFieldsByKind[Kind]
    ) => jsonMutation<ManagedContent<Kind>>(`/api/cms/content/${kind}/${encodeURIComponent(id)}`, 'PATCH', {version, fields}),
    publishManagedContent: <Kind extends ManagedContentKind>(kind: Kind, id: string, version: number) =>
      jsonMutation<ManagedContent<Kind> | PublishTicket>(`/api/cms/content/${kind}/${encodeURIComponent(id)}/publish`, 'POST', {version}),

    waitForRelease,

    async listReleases(): Promise<Release[]> {
      return (await request<Collection<Release>>('/api/cms/releases', {method: 'GET'})).items;
    }
  };
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AdminApiError(response.status, 'INVALID_RESPONSE', '内容服务返回了无法识别的数据。');
  }
}

function fallbackMessage(status: number): string {
  if (status === 401) return '登录已过期，请重新登录。';
  if (status === 403) return '当前操作未通过安全检查，请刷新后重试。';
  if (status === 409) return '内容已在其他标签页更新，请载入最新版本。';
  if (status === 413) return '上传文件过大，请压缩后重试。';
  if (status === 415) return '文件格式不受支持，请上传 JPG、PNG 或 WebP 图片。';
  return '内容服务暂时不可用，请稍后重试。';
}
