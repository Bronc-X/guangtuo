'use client';
import {AdminCustomerDesigns} from './admin-customer-designs';
import {AdminAiContent} from './admin-ai-content';
import {rememberWorkspace, workspaceParam} from '@/lib/content-ai-workflow';
import {AdminFontSize} from './admin-font-size';
import {fontStyle, setFontSize} from '@/lib/cms-typography';
import {AdminMarketing} from './admin-marketing';
import {AdminBusiness} from './admin-business';
import {AdminKnowledge} from './admin-knowledge';

/* eslint-disable @next/next/no-img-element */
import {Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode} from 'react';

import {
  AdminApiError,
  createAdminApi,
  type Article,
  type ArticleFields,
  type CmsUser,
  type HomeContent,
  type MediaAsset,
  type Release
} from '@/lib/admin-api';
import {ManagedContentView} from '@/components/admin-managed-content';
import {AdminMediaField} from '@/components/admin-media-field';
import {AdminInquiries} from '@/components/admin-inquiries';

import styles from './admin-console.module.css';

type AdminApi = ReturnType<typeof createAdminApi>;
type View = 'database' | 'customization' | 'studio' | 'factory' | 'about' | 'business' | 'commercial' | 'marketing' | 'dashboard' | 'home' | 'pages' | 'products' | 'formats' | 'credentials' | 'articles' | 'articleEditor' | 'media' | 'releases' | 'inquiries';
type AuthState = 'checking' | 'anonymous' | 'authenticated';
type WorkspaceState = 'idle' | 'loading' | 'ready' | 'error';
type PublishTarget = 'article' | 'home' | null;
type Conflict = {kind: 'article' | 'home'; message: string; current?: unknown};

type ArticleDraft = ArticleFields & {cover?: string};

const blankArticle: ArticleFields = {
  title: '',
  summary: '',
  body: '',
  category: '公司动态',
  coverMediaId: null
};

type Section = 'products' | 'customization' | 'studio' | 'factory' | 'credentials' | 'about' | 'marketing' | 'business' | 'commercial' | 'inquiries';
const navigation: Array<{id: Section; index: string; label: string}> = [
  {id: 'products', index: '01', label: '产品中心'},
  {id: 'customization', index: '02', label: '研发与定制'},
  {id: 'studio', index: '03', label: '3D 设计'},
  {id: 'factory', index: '04', label: '制造与品控'},
  {id: 'credentials', index: '05', label: '专利与创新'},
  {id: 'about', index: '06', label: '栏目内容'},
  {id: 'marketing', index: '07', label: '聚合营销'},
  {id: 'business', index: '08', label: '商务与机会'},
  {id: 'commercial', index: '09', label: '方案与报价'},
  {id: 'inquiries', index: '10', label: '询盘与邮件'}
];
const sectionViews: Record<Section, Array<Exclude<View, 'articleEditor'>>> = {
  products: ['products', 'formats'],
  customization: ['customization'],
  marketing: ['marketing'],
  business: ['business'],
  commercial: ['commercial'],
  inquiries: ['inquiries'],
  studio: ['studio'],
  factory: ['factory'],
  credentials: ['credentials'],
  about: ['home', 'dashboard', 'about', 'pages', 'articles', 'media', 'database', 'releases']
};
const sectionByView: Record<View, Section> = {
  products: 'products', formats: 'products', marketing: 'marketing',
  customization: 'customization', business: 'business', commercial: 'commercial', inquiries: 'inquiries',
  studio: 'studio', factory: 'factory', credentials: 'credentials', database: 'about',
  about: 'about', home: 'about', pages: 'about', articles: 'about', articleEditor: 'about', media: 'about', releases: 'about', dashboard: 'about'
};

const viewTitles: Record<View, string> = {
  database: '数据库',
  customization: '研发与定制',
  studio: '3D 设计',
  factory: '制造与品控',
  about: '关于我们',
  business: '商务与机会',
  commercial: '方案与报价',
  marketing: '聚合营销',
  dashboard: '工作台',
  home: '网站首页',
  pages: '联系我们',
  products: '产品中心',
  formats: '膜型',
  credentials: '专利与创新',
  articles: '文章',
  articleEditor: '文章编辑',
  media: '图片与文件',
  releases: '发布记录',
  inquiries: '询盘与邮件'
};

export function validateArticleDraft(draft: Pick<ArticleDraft, 'title' | 'summary' | 'body'> & Partial<Pick<ArticleDraft, 'cover' | 'coverMediaId'>>): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('请填写文章标题');
  if (!draft.summary.trim()) errors.push('请填写内容摘要');
  if (!(draft.coverMediaId ?? draft.cover ?? '').trim()) errors.push('请选择封面图片');
  if (!draft.body.trim()) errors.push('请填写文章正文');
  return errors;
}

async function fetchWorkspace(api: AdminApi) {
  const [home, articles, media, releases] = await Promise.all([
    api.getHome(),
    api.listArticles(),
    api.listMedia(),
    api.listReleases()
  ]);
  return {home, articles, media, releases};
}

export default function AdminConsole() {
  const apiRef = useRef<AdminApi | null>(null);
  if (!apiRef.current) apiRef.current = createAdminApi();
  const api = apiRef.current;

  const [authState, setAuthState] = useState<AuthState>('checking');
  const [user, setUser] = useState<CmsUser | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('idle');
  const [activeView, setActiveView] = useState<View>('products');
  const locationRestored = useRef(false);
  const activeSection = sectionByView[activeView];
  const [unreadInquiries, setUnreadInquiries] = useState(0);
  const [inquiryRefreshFailed, setInquiryRefreshFailed] = useState(false);
  const [, setHome] = useState<HomeContent | null>(null);
  const [homeDraft, setHomeDraft] = useState<HomeContent | null>(null);
  const [homeDirty, setHomeDirty] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [articleEntity, setArticleEntity] = useState<Article | null>(null);
  const [articleDraft, setArticleDraft] = useState<ArticleFields>(blankArticle);
  const [articleDirty, setArticleDirty] = useState(false);
  const [businessDirty, setBusinessDirty] = useState(false);
  const [businessBusy, setBusinessBusy] = useState(false);
  const [managedDirty, setManagedDirty] = useState(false);
  const [managedBusy, setManagedBusy] = useState(false);
  const [patentPage, setPatentPage] = useState(false);
  const [articleErrors, setArticleErrors] = useState<string[]>([]);
  const [operationError, setOperationError] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [publishTarget, setPublishTarget] = useState<PublishTarget>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  useEffect(() => {
    if (authState !== 'authenticated') return;
    let active = true;
    const refresh = () => void api.listInquiries().then(data => {if(active) {setUnreadInquiries(data.items.filter(item => !item.readAt).length); setInquiryRefreshFailed(false);}}).catch(() => {if(active) setInquiryRefreshFailed(true);});
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => {active = false; clearInterval(timer);};
  }, [api, authState]);
  useEffect(() => {
    const followLink = () => {if(window.location.hash.startsWith('#inquiries/')) setActiveView('inquiries');};
    followLink(); window.addEventListener('hashchange', followLink);
    return () => window.removeEventListener('hashchange', followLink);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setConnectionError('');
      setAuthState('checking');
      try {
        const session = await api.getSession();
        if (cancelled) return;
        if (!session.authenticated) {
          setAuthState('anonymous');
          return;
        }
        setUser(session.user);
        setAuthState('authenticated');
        setWorkspaceState('loading');
        const data = await fetchWorkspace(api);
        if (cancelled) return;
        applyWorkspace(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof AdminApiError && error.status === 401) setAuthState('anonymous');
        else {
          setConnectionError(messageFrom(error));
          setAuthState('checking');
        }
      }
    }
    void bootstrap();
    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function applyWorkspace(data: {home: HomeContent; articles: Article[]; media: MediaAsset[]; releases: Release[]}) {
    if (!locationRestored.current) {
      const requested = workspaceParam('view');
      if (window.location.hash.startsWith('#inquiries/')) setActiveView('inquiries');
      else if (requested && Object.hasOwn(sectionByView, requested)) {
        if (requested === 'articleEditor') {
          const article = data.articles.find(item => item.id === workspaceParam('article'));
          if (article) {setArticleEntity(article); setArticleDraft(toArticleFields(article)); setActiveView('articleEditor');}
          else setActiveView('articles');
        } else setActiveView(requested as View);
      }
      locationRestored.current = true;
    }
    setHome(data.home);
    setHomeDraft(data.home);
    setArticles(data.articles);
    setMedia(data.media);
    setReleases(data.releases);
    setHomeDirty(false);
    setWorkspaceState('ready');
  }

  useEffect(() => {
    if (workspaceState !== 'ready' || !locationRestored.current) return;
    rememberWorkspace({view: activeView, article: activeView === 'articleEditor' ? articleEntity?.id ?? null : null});
    if (activeView !== 'inquiries' && window.location.hash.startsWith('#inquiries/')) {
      const url = new URL(window.location.href); url.hash = ''; window.history.replaceState(window.history.state, '', url);
    }
  }, [activeView, articleEntity?.id, workspaceState]);

  async function reloadWorkspace() {
    setWorkspaceState('loading');
    setOperationError('');
    try {
      applyWorkspace(await fetchWorkspace(api));
    } catch (error) {
      setWorkspaceState('error');
      handleFailure(error);
    }
  }

  function handleFailure(error: unknown, kind?: Conflict['kind']) {
    if (error instanceof AdminApiError) {
      if (error.status === 401) {
        setUser(null);
        setAuthState('anonymous');
        setOperationError('登录已过期，请重新登录。');
        return;
      }
      if (error.status === 409 && error.code === 'VERSION_CONFLICT' && kind) {
        setConflict({kind, message: error.message, current: error.current});
        return;
      }
    }
    setOperationError(messageFrom(error));
  }

  async function handleLogin(credentials: {username: string; password: string}) {
    setBusy('login');
    setOperationError('');
    try {
      const session = await api.login(credentials);
      setUser(session.user);
      setAuthState('authenticated');
      setWorkspaceState('loading');
      try {
        applyWorkspace(await fetchWorkspace(api));
      } catch (error) {
        setWorkspaceState('error');
        handleFailure(error);
      }
    } catch (error) {
      setOperationError(messageFrom(error));
      throw error;
    } finally {
      setBusy('');
    }
  }

  async function handleLogout() {
    if ((businessDirty || managedDirty || homeDirty || articleDirty) && !window.confirm('有未保存的修改，确认退出登录吗？')) return;
    setBusy('logout');
    setOperationError('');
    try {
      await api.logout();
      setAuthState('anonymous');
      setUser(null);
      setWorkspaceState('idle');
      setActiveView('dashboard');
    } catch (error) {
      handleFailure(error);
    } finally {
      setBusy('');
    }
  }

  function navigate(view: View) {
    if (businessBusy || managedBusy || view === activeView) return;
    if (managedDirty && !window.confirm('当前修改尚未保存，确认切换到其他栏目吗？')) return;
    if (businessDirty && !window.confirm('当前模块有未保存的内容，是否放弃修改？')) return;
    setActiveView(view);
    setOperationError('');
    setPublishTarget(null);
  }

  function startArticle() {
    setArticleEntity(null);
    setArticleDraft(blankArticle);
    setArticleDirty(false);
    setArticleErrors([]);
    navigate('articleEditor');
  }

  function editArticle(article: Article) {
    setArticleEntity(article);
    setArticleDraft(toArticleFields(article));
    setArticleDirty(false);
    setArticleErrors([]);
    navigate('articleEditor');
  }

  function updateArticleField<Key extends keyof ArticleFields>(key: Key, value: ArticleFields[Key]) {
    setArticleDraft((current) => ({...current, [key]: value}));
    setArticleDirty(true);
    setArticleErrors([]);
  }

  async function saveArticle(): Promise<Article | null> {
    setBusy('save-article');
    setOperationError('');
    try {
      const saved = articleEntity
        ? await api.updateArticle(articleEntity.id, {...articleDraft, version: articleEntity.version})
        : await api.createArticle(articleDraft);
      setArticleEntity(saved);
      setArticleDraft(toArticleFields(saved));
      setArticleDirty(false);
      setArticles((current) => upsert(current, saved));
      setToast('文章草稿已保存。');
      return saved;
    } catch (error) {
      handleFailure(error, 'article');
      return null;
    } finally {
      setBusy('');
    }
  }

  async function deleteArticleDraft() {
    if (!articleEntity || articleEntity.status !== 'draft') return;
    const title = articleEntity.title.trim() || '未命名文章';
    if (!window.confirm(`确认删除草稿“${title}”吗？删除后无法恢复。`)) return;

    setBusy('delete-article');
    setOperationError('');
    try {
      await api.deleteArticle(articleEntity.id, articleEntity.version);
      setArticles((current) => current.filter((article) => article.id !== articleEntity.id));
      setArticleEntity(null);
      setArticleDraft(blankArticle);
      setArticleDirty(false);
      setArticleErrors([]);
      navigate('articles');
      setToast('文章草稿已删除。');
    } catch (error) {
      handleFailure(error, 'article');
    } finally {
      setBusy('');
    }
  }

  function requestArticlePublish() {
    const errors = validateArticleDraft({...articleDraft, cover: articleEntity?.cover});
    setArticleErrors(errors);
    if (!errors.length) setPublishTarget('article');
  }

  async function publishArticle() {
    setBusy('publish-article');
    setOperationError('');
    try {
      let current = articleEntity;
      if (!current || articleDirty) {
        current = current
          ? await api.updateArticle(current.id, {...articleDraft, version: current.version})
          : await api.createArticle(articleDraft);
      }
      const result = await api.publishArticle(current.id, current.version);
      if (result.status === 'building') {
        setToast('已开始发布文章，正在生成全部语言的网站页面。');
        await api.waitForRelease(result.releaseId);
      }
      const published = result.status === 'building'
        ? (await api.listArticles()).find((item) => item.id === current.id)
        : result;
      if (!published) throw new Error('发布已完成，但无法读取最新文章，请刷新后台。');
      setArticleEntity(published);
      setArticleDraft(toArticleFields(published));
      setArticleDirty(false);
      setArticles((items) => upsert(items, published));
      setReleases(await api.listReleases());
      setPublishTarget(null);
      setToast('文章已发布到网站。');
    } catch (error) {
      handleFailure(error, 'article');
    } finally {
      setBusy('');
    }
  }

  function updateHomeField<Key extends 'heroTitle' | 'heroBody' | 'heroMediaId' | 'textStyles'>(key: Key, value: HomeContent[Key]) {
    setHomeDraft((current) => current ? {...current, [key]: value} : current);
    setHomeDirty(true);
  }

  async function saveHome(): Promise<HomeContent | null> {
    if (!homeDraft) return null;
    setBusy('save-home');
    setOperationError('');
    try {
      const saved = await api.updateHome({
        textStyles: homeDraft.textStyles,
        heroTitle: homeDraft.heroTitle,
        heroBody: homeDraft.heroBody,
        heroMediaId: homeDraft.heroMediaId,
        version: homeDraft.version
      });
      setHome(saved);
      setHomeDraft(saved);
      setHomeDirty(false);
      setToast('首页草稿已保存。');
      return saved;
    } catch (error) {
      handleFailure(error, 'home');
      return null;
    } finally {
      setBusy('');
    }
  }

  function requestHomePublish() {
    if (!homeDraft?.heroTitle.trim() || !homeDraft.heroBody.trim() || (!homeDraft.heroMediaId && !homeDraft.heroImage)) {
      setOperationError('发布首页前，请填写主标题、简介并选择首屏图片。');
      return;
    }
    setOperationError('');
    setPublishTarget('home');
  }

  async function publishHome() {
    if (!homeDraft) return;
    setBusy('publish-home');
    setOperationError('');
    try {
      let current = homeDraft;
      if (homeDirty) {
        current = await api.updateHome({
          textStyles: homeDraft.textStyles,
        heroTitle: homeDraft.heroTitle,
          heroBody: homeDraft.heroBody,
          heroMediaId: homeDraft.heroMediaId,
          version: homeDraft.version
        });
      }
      const result = await api.publishHome(current.version);
      if (result.status === 'building') {
        setToast('已开始发布首页，正在生成全部语言的网站页面。');
        await api.waitForRelease(result.releaseId);
      }
      const published = result.status === 'building' ? await api.getHome() : result;
      setHome(published);
      setHomeDraft(published);
      setHomeDirty(false);
      setReleases(await api.listReleases());
      setPublishTarget(null);
      setToast('首页已发布到网站。');
    } catch (error) {
      handleFailure(error, 'home');
    } finally {
      setBusy('');
    }
  }

  async function uploadAtField(file: File): Promise<MediaAsset> {
    setBusy('upload-media');
    try {
      const asset = await api.uploadMedia(file);
      setMedia(current => [asset, ...current.filter(item => item.id !== asset.id)]);
      return asset;
    } finally {setBusy('');}
  }

  async function uploadMedia(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setOperationError('仅支持 JPG、PNG、WebP 图片或普通 PDF。');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setOperationError('文件不能超过 8 MB。');
      return;
    }
    setBusy('upload-media');
    setOperationError('');
    try {
      const asset = await api.uploadMedia(file);
      setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
      setToast(`“${asset.name}”已上传，可用于页面、产品、膜型、证书和文章。`);
    } catch (error) {
      handleFailure(error);
    } finally {
      setBusy('');
    }
  }

  async function deleteMedia(asset: MediaAsset) {
    if (!window.confirm(`删除“${asset.name}”？\n\n正在被页面、产品、膜型、证书或文章使用的文件不会被删除。`)) return;
    setBusy(`delete-media:${asset.id}`);
    setOperationError('');
    try {
      await api.deleteMedia(asset.id);
      setMedia((current) => current.filter((item) => item.id !== asset.id));
      setToast(`“${asset.name}”已删除。`);
    } catch (error) {
      handleFailure(error);
    } finally {
      setBusy('');
    }
  }

  function acceptServerVersion() {
    if (!conflict) return;
    if (conflict.kind === 'article' && isArticle(conflict.current)) {
      setArticleEntity(conflict.current);
      setArticleDraft(toArticleFields(conflict.current));
      setArticleDirty(false);
      setArticles((current) => upsert(current, conflict.current as Article));
    } else if (conflict.kind === 'home' && isHome(conflict.current)) {
      setHome(conflict.current);
      setHomeDraft(conflict.current);
      setHomeDirty(false);
    } else {
      void reloadWorkspace();
    }
    setConflict(null);
  }

  if (authState === 'checking') {
    return <ConnectionScreen error={connectionError} onRetry={() => window.location.reload()} />;
  }
  if (authState === 'anonymous') {
    return <LoginScreen busy={busy === 'login'} error={operationError} onLogin={handleLogin} />;
  }

  const content = workspaceState === 'loading'
    ? <LoadingPanel label="正在进入内容工作台" />
    : workspaceState === 'error'
      ? <ErrorPanel message={operationError || '网站内容读取失败。'} onRetry={reloadWorkspace} />
      : renderView();

  function renderView() {
    const managed = (kind: 'pages' | 'products' | 'formats' | 'credentials', recordIds?: string) => <ManagedContentView key={`${activeView}-${kind}-${recordIds ?? "all"}`} api={api} kind={kind} title={viewTitles[activeView]} recordIds={recordIds} media={media} onUpload={uploadAtField} uploadBusy={busy === 'upload-media'} onDirty={setManagedDirty} onBusy={setManagedBusy} onPublished={async () => setReleases(await api.listReleases())} />;
    switch (activeView) {
      case 'customization':
        return managed('pages', 'customization,process');
      case 'factory':
        return managed('pages', 'factory');
      case 'about':
        return managed('pages', 'about');
      case 'studio':
        return <AdminCustomerDesigns api={api} />;
      case 'business':
      case 'commercial':
        return <AdminBusiness key={activeView} api={api} mode={activeView} onDirty={setBusinessDirty} onBusy={setBusinessBusy} />;
      case 'marketing':
        return <AdminMarketing uploadBusy={Boolean(busy)} api={api} media={media} onUpload={uploadAtField} onDirty={setBusinessDirty} onBusy={setBusinessBusy} />;
      case 'database':
        return <AdminKnowledge api={api} onDirty={setBusinessDirty} onBusy={setBusinessBusy} />;
      case 'home':
        return <HomeEditor api={api} busy={busy} draft={homeDraft} dirty={homeDirty} media={media} onUpload={uploadAtField} onChange={updateHomeField} onPublish={requestHomePublish} onSave={saveHome} />;
      case 'articles':
        return <div className={styles.pageStack}><header className={styles.welcome}><div><p className={styles.kicker}>网站内容</p><h1>文章</h1></div></header><AdminAiContent kind="article" api={api} media={media} onUpload={uploadAtField} uploadBusy={Boolean(busy)} onDirty={setBusinessDirty} onBusy={setBusinessBusy} onAdopt={async id => {const [nextArticles, nextMedia] = await Promise.all([api.listArticles(), api.listMedia()]); setArticles(nextArticles); setMedia(nextMedia); const article = nextArticles.find(item => item.id === id); if (article) {setArticleEntity(article); setArticleDraft(toArticleFields(article)); setArticleDirty(false); setArticleErrors([]); setActiveView('articleEditor');}}} /><details className={styles.articleLibrary}><summary>文章库 · {articles.length} 篇文章</summary><ArticlesView articles={articles} onCreate={startArticle} onEdit={editArticle} /></details></div>;
      case 'articleEditor':
        return <ArticleEditor api={api} busy={busy} dirty={articleDirty} draft={articleDraft} entity={articleEntity} errors={articleErrors} media={media} onUpload={uploadAtField} onBack={() => navigate('articles')} onChange={updateArticleField} onDelete={deleteArticleDraft} onPublish={requestArticlePublish} onSave={saveArticle} />;
      case 'pages':
        return managed('pages', 'contact');
      case 'products':
        return managed('products');
      case 'formats':
        return managed('formats');
      case 'credentials':
        return <div className={styles.pageStack}><div className={styles.sectionTabs} aria-label="专利内容分类">{[{page: false, label: '专利资质'}, {page: true, label: '页面介绍'}].map(tab => <button type="button" key={tab.label} disabled={managedBusy || Boolean(busy)} aria-pressed={patentPage === tab.page} onClick={() => {if (patentPage === tab.page) return; if (managedDirty && !window.confirm('当前修改尚未保存，确认切换吗？')) return; setPatentPage(tab.page);}}>{tab.label}</button>)}</div>{patentPage ? managed('pages', 'patents') : managed('credentials')}</div>;
      case 'inquiries':
        return <AdminInquiries api={api} onDirty={setBusinessDirty} onBusy={setBusinessBusy} />;
      case 'media':
        return <MediaView api={api} assets={media} busy={busy} onDelete={deleteMedia} onUpload={uploadMedia} />;
      case 'releases':
        return <ReleaseHistory releases={releases} />;
      default:
        return <Dashboard articles={articles} media={media} releases={releases} user={user} onNavigate={navigate} onStartArticle={startArticle} />;
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="后台主导航">
        <button className={styles.brand} type="button" onClick={() => navigate('dashboard')} aria-label="返回工作台">
          <span className={styles.brandMark}>GT</span>
          <span className={styles.brandName}>修齐生物<small>内容工作台</small></span>
        </button>
        <div className={styles.navLabel}>网站内容</div>
        <nav className={styles.navList}>
          {navigation.map((item) => (
            <Fragment key={item.id}>
            {item.id === 'marketing' && <div className={styles.navGroupTitle}>商务运营</div>}
            <button disabled={Boolean(busy) || businessBusy || managedBusy} className={styles.navItem} data-active={activeSection === item.id} key={item.id} type="button" onClick={() => navigate(sectionViews[item.id][0])} aria-current={activeSection === item.id ? 'page' : undefined} aria-label={item.label}>
              <span className={styles.navIndex}>{item.index}</span><span className={styles.navText}>{item.label}{item.id === 'inquiries' && (inquiryRefreshFailed ? ' · 刷新失败' : unreadInquiries ? ` · ${unreadInquiries} 未读` : '')}</span>
            </button>
            </Fragment>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.userCard}><span>{user?.name.slice(0, 1) || '管'}</span><p><strong>{user?.name || '网站维护人'}</strong><small>{user?.username}</small></p></div>
          <button type="button" disabled={busy === 'logout' || businessBusy || managedBusy} onClick={handleLogout}>{busy === 'logout' ? '正在退出…' : '退出登录'}</button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>修齐网站</span><b>/</b><strong>{viewTitles[activeView]}</strong></div>
          <a className={styles.siteLink} href="/zh/" target="_blank" rel="noreferrer">查看网站 ↗</a>
        </header>
        <main className={styles.main}>
          {operationError && workspaceState !== 'error' ? <div className={styles.alert} role="alert"><span>!</span><p>{operationError}</p><button type="button" onClick={() => setOperationError('')}>关闭</button></div> : null}
          {sectionViews[activeSection].length > 1 && <div className={styles.sectionPicker}><label htmlFor="section-content">栏目内容</label><select id="section-content" value={activeView === 'articleEditor' ? 'articles' : activeView} disabled={Boolean(busy) || businessBusy || managedBusy} onChange={event => navigate(event.target.value as View)}>{sectionViews[activeSection].map(view => <option key={view} value={view}>{view === 'products' ? '产品资料' : view === 'pages' ? '联系我们' : viewTitles[view]}{view === 'inquiries' ? inquiryRefreshFailed ? ' · 刷新失败' : unreadInquiries ? ` · ${unreadInquiries} 未读` : '' : ''}</option>)}</select></div>}
          {content}
        </main>
      </section>

      {publishTarget ? <PublishDialog target={publishTarget} title={publishTarget === 'article' ? articleDraft.title : homeDraft?.heroTitle || '网站首页'} busy={busy.startsWith('publish')} onCancel={() => setPublishTarget(null)} onConfirm={publishTarget === 'article' ? publishArticle : publishHome} /> : null}
      {conflict ? <ConflictDialog conflict={conflict} onCancel={() => setConflict(null)} onLoadLatest={acceptServerVersion} /> : null}
      {toast ? <div className={styles.toast} role="status"><span>✓</span>{toast}</div> : null}
    </div>
  );
}

function ConnectionScreen({error, onRetry}: {error: string; onRetry: () => void}) {
  return <div className={styles.authShell}><div className={styles.authBrand}><span>GT</span><p><strong>修齐生物</strong><small>内容工作台</small></p></div><section className={styles.connectionCard}>{error ? <><p className={styles.kicker}>暂时无法打开</p><h1>后台连接失败</h1><p>{error}</p><button className={styles.primaryButton} type="button" onClick={onRetry}>重试</button></> : <><span className={styles.spinner} aria-hidden="true" /><p className={styles.kicker}>网站内容维护</p><h1>正在进入内容工作台</h1><p>请稍候。</p></>}</section></div>;
}

function LoginScreen({busy, error, onLogin}: {busy: boolean; error: string; onLogin: (credentials: {username: string; password: string}) => Promise<void>}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setLocalError('请输入用户名和密码。');
      return;
    }
    setLocalError('');
    try { await onLogin({username: username.trim(), password}); } catch { /* Parent displays the server error. */ }
  }
  return <div className={styles.authShell}><div className={styles.authBrand}><span>GT</span><p><strong>修齐生物</strong><small>内容工作台</small></p></div><section className={styles.loginCard}><div><p className={styles.kicker}>网站内容维护</p><h1>登录后台</h1></div>{error || localError ? <div className={styles.loginError} role="alert">{localError || error}</div> : null}<form onSubmit={submit}><label><span>用户名</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label><label><span>密码</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? '正在登录…' : '登录并进入工作台'}</button></form></section></div>;
}

function Dashboard({articles, media, releases, user, onNavigate, onStartArticle}: {articles: Article[]; media: MediaAsset[]; releases: Release[]; user: CmsUser | null; onNavigate: (view: View) => void; onStartArticle: () => void}) {
  const drafts = articles.filter((article) => article.status === 'draft').length;
  const latest = releases[0];
  return <div className={styles.pageStack}><header className={styles.welcome}><div><p className={styles.kicker}>今日维护</p><h1>你好，{user?.name || '网站维护人'}</h1><p>选择要修改的内容，保存草稿，确认后发布。</p></div><div className={styles.liveBadge}><i /><p><strong>后台运行正常</strong><small>{latest ? `最近发布：${formatDate(latest.publishedAt)}` : '还没有发布记录'}</small></p></div></header><section className={styles.quickActions} aria-label="常用操作"><button type="button" onClick={onStartArticle}><span>01</span><p><strong>写新文章</strong><small>新建文章并保存草稿</small></p><b>＋</b></button><button type="button" onClick={() => onNavigate('products')}><span>02</span><p><strong>维护产品</strong><small>修改卖点、规格与图片</small></p><b>→</b></button><button type="button" onClick={() => onNavigate('media')}><span>03</span><p><strong>上传图片</strong><small>为页面和产品补充图片</small></p><b>↑</b></button></section><div className={styles.summaryGrid}><button type="button" onClick={() => onNavigate('articles')}><span>文章</span><strong>{articles.length}</strong><small>{drafts ? `${drafts} 篇草稿未发布` : '没有待发布草稿'}</small></button><button type="button" onClick={() => onNavigate('media')}><span>图片</span><strong>{media.length}</strong><small>可用于网站内容</small></button><button type="button" onClick={() => onNavigate('releases')}><span>发布</span><strong>{releases.length}</strong><small>{latest ? latest.title : '暂无发布记录'}</small></button></div></div>;
}

function ArticlesView({articles, onCreate, onEdit}: {articles: Article[]; onCreate: () => void; onEdit: (article: Article) => void}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => articles.filter((article) => `${article.title}${article.summary}${article.category}`.toLowerCase().includes(query.trim().toLowerCase())), [articles, query]);
  return <div className={styles.pageStack}><PageHeading kicker="内容写作" title="文章" body="" action={<button className={styles.primaryButton} type="button" onClick={onCreate}>＋ 写新文章</button>} /><div className={styles.listToolbar}><label><span className="sr-only">搜索文章</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="按标题、摘要或分类搜索" /></label><span>{filtered.length} 篇文章</span></div>{filtered.length ? <section className={styles.contentList}>{filtered.map((article) => <button key={article.id} type="button" onClick={() => onEdit(article)}><div><Status status={article.status} /><h2>{article.title || '未命名文章'}</h2><p>{article.summary || '还没有填写摘要'}</p></div><dl><div><dt>分类</dt><dd>{article.category}</dd></div><div><dt>最近保存</dt><dd>{formatDate(article.updatedAt)}</dd></div></dl><b>编辑 →</b></button>)}</section> : <EmptyState title={query ? '没有符合条件的文章' : '还没有文章'} body={query ? '换个关键词再试。' : '写好第一篇文章后，先保存草稿。'} action={!query ? <button className={styles.primaryButton} type="button" onClick={onCreate}>写第一篇文章</button> : undefined} />}</div>;
}

function ArticleEditor({api, busy, dirty, draft, entity, errors, media, onUpload, onBack, onChange, onDelete, onPublish, onSave}: {api: AdminApi; busy: string; dirty: boolean; draft: ArticleFields; entity: Article | null; errors: string[]; media: MediaAsset[]; onUpload: (file: File) => Promise<MediaAsset>; onBack: () => void; onChange: <Key extends keyof ArticleFields>(key: Key, value: ArticleFields[Key]) => void; onDelete: () => Promise<void>; onPublish: () => void; onSave: () => Promise<Article | null>}) {
  const cover = media.find((asset) => asset.id === draft.coverMediaId);
  const coverSrc = cover ? api.resolveUrl(cover.url) : entity?.cover;
  return <div className={styles.editorPage}><header className={styles.editorHeader}><button className={styles.backButton} type="button" onClick={onBack}>← 返回文章</button><span className={dirty ? styles.unsaved : styles.saved}>{dirty ? '有尚未保存的修改' : entity ? `版本 ${entity.version} · 已保存` : '新文章'}</span><div>{entity?.status === 'draft' && !entity.published ? <button className={styles.dangerButton} type="button" disabled={Boolean(busy)} onClick={() => void onDelete()}>{busy === 'delete-article' ? '删除中…' : '删除草稿'}</button> : null}<button className={styles.secondaryButton} type="button" disabled={Boolean(busy)} onClick={() => void onSave()}>{busy === 'save-article' ? '保存中…' : '保存草稿'}</button><button className={styles.primaryButton} type="button" disabled={Boolean(busy)} onClick={onPublish}>发布文章</button></div></header>{errors.length ? <section className={styles.errorSummary} role="alert"><strong>发布前还需完成 {errors.length} 项</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></section> : null}<div className={styles.editorGrid}><section className={styles.formPanel}><div className={styles.formSection}><p className={styles.kicker}>文章信息</p>{([['title','文章标题'],['summary','摘要'],['body','正文']] as const).map(([field,label]) => <AdminFontSize key={field} label={label} value={draft.textStyles?.[field]} disabled={Boolean(busy)} onChange={size=>onChange('textStyles',setFontSize(draft.textStyles,field,size))} />)}<label><span>文章标题</span><textarea rows={2} maxLength={80} value={draft.title} onChange={(event) => onChange('title', event.target.value)} placeholder="填写清楚、具体的文章标题" /></label><label><span>内容摘要</span><textarea rows={3} maxLength={220} value={draft.summary} onChange={(event) => onChange('summary', event.target.value)} placeholder="用一两句话说明文章内容" /></label><label><span>文章分类</span><select value={draft.category} onChange={(event) => onChange('category', event.target.value)}>{draft.category && !['公司动态','产品与膜型','配方与工艺知识','制造与品控','品牌开发指南'].includes(draft.category) && <option>{draft.category}</option>}<option>公司动态</option><option>产品与膜型</option><option>配方与工艺知识</option><option>制造与品控</option><option>品牌开发指南</option></select></label><AdminMediaField label="封面图片" value={draft.coverMediaId} media={media} disabled={Boolean(busy)} currentLabel={entity?.cover ? '恢复原始网站封面' : '请选择图片'} onUpload={onUpload} onChange={id => onChange('coverMediaId', id)} /></div><div className={styles.formSection}><p className={styles.kicker}>正文</p><label><span className="sr-only">文章正文</span><textarea className={styles.bodyEditor} rows={18} value={draft.body} onChange={(event) => onChange('body', event.target.value)} placeholder={'从这里开始写正文…\n\n建议一段只说明一件事。'} /></label></div></section><aside className={styles.previewPanel}><p className={styles.kicker}>网站预览</p><div className={styles.articlePreview}>{coverSrc ? <img src={coverSrc} crossOrigin={cover ? 'use-credentials' : undefined} alt="文章封面预览" /> : <div className={styles.imagePlaceholder}>选择封面后在这里预览</div>}<small>{draft.category}</small><h2 style={fontStyle(draft.textStyles, 'title')}>{draft.title || '文章标题'}</h2><strong style={fontStyle(draft.textStyles, 'summary')}>{draft.summary || '内容摘要会显示在这里。'}</strong><div><p className="cms-text" style={fontStyle(draft.textStyles, 'body')}>{draft.body || '正文预览'}</p></div></div></aside></div></div>;
}

function HomeEditor({api, busy, draft, dirty, media, onUpload, onChange, onPublish, onSave}: {api: AdminApi; busy: string; draft: HomeContent | null; dirty: boolean; media: MediaAsset[]; onUpload: (file: File) => Promise<MediaAsset>; onChange: <Key extends 'heroTitle' | 'heroBody' | 'heroMediaId' | 'textStyles'>(key: Key, value: HomeContent[Key]) => void; onPublish: () => void; onSave: () => Promise<HomeContent | null>}) {
  if (!draft) return <EmptyState title="首页内容尚未初始化" body="请先完成后台初始化。" />;
  const hero = media.find((asset) => asset.id === draft.heroMediaId);
  const heroSrc = hero ? api.resolveUrl(hero.url) : draft.heroImage;
  return <div className={styles.pageStack}><PageHeading kicker="网站首屏" title="修改首页" body="" action={<span className={dirty ? styles.unsaved : styles.saved}>{dirty ? '有尚未保存的修改' : `版本 ${draft.version} · 已保存`}</span>} /><div className={styles.homeGrid}><section className={styles.homePreview}><div className={styles.miniSiteBar}><strong>SHOWKI BIOTECH</strong><span>产品 · 定制 · 工厂 · 关于</span></div><div className={styles.heroPreview}><div><small>水凝胶成品与定制开发</small><h2 style={fontStyle(draft.textStyles, 'heroTitle')}>{draft.heroTitle || '首页主标题'}</h2><p style={fontStyle(draft.textStyles, 'heroBody')}>{draft.heroBody || '首页简介'}</p><span>查看产品</span></div>{heroSrc ? <img src={heroSrc} crossOrigin={hero ? 'use-credentials' : undefined} alt="首页首屏图片预览" /> : <div className={styles.imagePlaceholder}>尚未选择首屏图片</div>}</div></section><aside className={styles.homeForm}><p className={styles.kicker}>首屏内容</p><label><span>主标题</span><textarea rows={3} value={draft.heroTitle} onChange={(event) => onChange('heroTitle', event.target.value)} /></label><AdminFontSize label="主标题" value={draft.textStyles?.heroTitle} disabled={Boolean(busy)} onChange={size => onChange('textStyles', setFontSize(draft.textStyles, 'heroTitle', size))} /><label><span>简介</span><textarea rows={5} value={draft.heroBody} onChange={(event) => onChange('heroBody', event.target.value)} /></label><AdminFontSize label="简介" value={draft.textStyles?.heroBody} disabled={Boolean(busy)} onChange={size => onChange('textStyles', setFontSize(draft.textStyles, 'heroBody', size))} /><AdminMediaField label="首屏图片" value={draft.heroMediaId} media={media} disabled={Boolean(busy)} currentLabel={draft.heroImage ? '保留当前网站图片' : '请选择图片'} onUpload={onUpload} onChange={id => onChange('heroMediaId', id)} /><div className={styles.formActions}><button className={styles.secondaryButton} type="button" disabled={Boolean(busy)} onClick={() => void onSave()}>{busy === 'save-home' ? '保存中…' : '保存草稿'}</button><button className={styles.primaryButton} type="button" disabled={Boolean(busy)} onClick={onPublish}>发布首页</button></div></aside></div></div>;
}

function MediaView({api, assets, busy, onDelete, onUpload}: {api: AdminApi; assets: MediaAsset[]; busy: string; onDelete: (asset: MediaAsset) => Promise<void>; onUpload: (file: File | undefined) => Promise<void>}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = busy === 'upload-media';
  return <div className={styles.pageStack}><PageHeading kicker="网站素材" title="图片与文件" body="JPG / PNG / WebP / PDF · 单个文件 ≤ 8 MB" action={<button className={styles.primaryButton} type="button" disabled={Boolean(busy)} onClick={() => inputRef.current?.click()}>{uploading ? '上传中…' : '＋ 上传文件'}</button>} /><input className={styles.hiddenInput} ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => { void onUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} />{assets.length ? <section className={styles.mediaGrid}>{assets.map((asset) => <article key={asset.id}><div className={styles.mediaPreview}>{asset.mimeType === 'application/pdf' ? <a href={api.resolveUrl(asset.url)} download={asset.name}>↓ PDF · {asset.name}</a> : <img src={api.resolveUrl(asset.url)} crossOrigin="use-credentials" alt={asset.name} />}</div><h2>{asset.name}</h2><p>{formatBytes(asset.size)}{asset.width && asset.height ? ` · ${asset.width} × ${asset.height}` : ''}</p><time>{formatDate(asset.createdAt)}</time><button className={styles.mediaDelete} type="button" disabled={Boolean(busy)} onClick={() => void onDelete(asset)}>{busy === `delete-media:${asset.id}` ? '删除中…' : '删除文件'}</button></article>)}</section> : <EmptyState title="还没有文件" body="上传后，可在页面、产品、膜型、证书和文章中选择。" action={<button className={styles.primaryButton} type="button" onClick={() => inputRef.current?.click()}>上传第一个文件</button>} />}</div>;
}

function ReleaseHistory({releases}: {releases: Release[]}) {
  return <div className={styles.pageStack}><PageHeading kicker="发布历史" title="发布记录" body="" />{releases.length ? <section className={styles.releaseList}>{releases.map((release) => <article key={release.id}><span data-status={release.status}>{release.status === 'live' ? '已上线' : release.status === 'building' ? '构建部署中' : '发布失败'}</span><div><h2>{release.title}</h2><p>{releaseKindLabel(release.kind)}{release.message ? ` · ${release.message}` : ''}</p></div><time>{formatDate(release.publishedAt)}</time></article>)}</section> : <EmptyState title="还没有发布记录" body="完成第一次发布后，可在这里查看结果。" />}</div>;
}

function PublishDialog({target, title, busy, onCancel, onConfirm}: {target: Exclude<PublishTarget, null>; title: string; busy: boolean; onCancel: () => void; onConfirm: () => Promise<void>}) {
  return <div className={styles.dialogBackdrop} role="presentation" onMouseDown={onCancel}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="publish-title" onMouseDown={(event) => event.stopPropagation()}><p className={styles.kicker}>发布确认</p><h2 id="publish-title">确认发布{target === 'home' ? '首页' : '文章'}？</h2><p>将保存并发布“{title}”至全部语言。</p><div className={styles.dialogActions}><button className={styles.secondaryButton} type="button" disabled={busy} onClick={onCancel}>继续修改</button><button className={styles.primaryButton} type="button" disabled={busy} onClick={() => void onConfirm()}>{busy ? '正在翻译并发布全部语言…' : '确认发布'}</button></div></section></div>;
}

function ConflictDialog({conflict, onCancel, onLoadLatest}: {conflict: Conflict; onCancel: () => void; onLoadLatest: () => void}) {
  return <div className={styles.dialogBackdrop} role="presentation"><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="conflict-title"><p className={styles.kicker}>版本冲突</p><h2 id="conflict-title">内容已在别处更新</h2><p>{conflict.message}。载入服务器版本会替换当前表单；也可以先取消，手动复制尚未保存的文字。</p><div className={styles.dialogActions}><button className={styles.secondaryButton} type="button" onClick={onCancel}>保留当前表单</button><button className={styles.primaryButton} type="button" onClick={onLoadLatest}>载入最新版本</button></div></section></div>;
}

function PageHeading({kicker, title, body, action}: {kicker: string; title: string; body: string; action?: ReactNode}) {
  return <header className={styles.pageHeading}><div><p className={styles.kicker}>{kicker}</p><h1>{title}</h1>{body && <p>{body}</p>}</div>{action ? <div>{action}</div> : null}</header>;
}

function Status({status}: {status: Article['status']}) {
  return <span className={styles.status} data-status={status}>{status === 'published' ? '已发布' : '草稿'}</span>;
}

function EmptyState({title, body, action}: {title: string; body: string; action?: ReactNode}) {
  return <section className={styles.emptyState}><span>＋</span><h2>{title}</h2><p>{body}</p>{action}</section>;
}

function LoadingPanel({label}: {label: string}) {
  return <section className={styles.statePanel} role="status"><span className={styles.spinner} aria-hidden="true" /><h1>{label}</h1><p>请稍候。</p></section>;
}

function ErrorPanel({message, onRetry}: {message: string; onRetry: () => void}) {
  return <section className={styles.statePanel} role="alert"><span className={styles.errorMark}>!</span><h1>内容读取失败</h1><p>{message}</p><button className={styles.primaryButton} type="button" onClick={() => void onRetry()}>重新读取</button></section>;
}

function toArticleFields(article: Article): ArticleFields {
  return {textStyles: article.textStyles, title: article.title, summary: article.summary, body: article.body, category: article.category, coverMediaId: article.coverMediaId};
}

function upsert(items: Article[], article: Article): Article[] {
  return [article, ...items.filter((item) => item.id !== article.id)];
}

function isArticle(value: unknown): value is Article {
  return Boolean(value && typeof value === 'object' && 'id' in value && 'title' in value && 'version' in value);
}

function isHome(value: unknown): value is HomeContent {
  return Boolean(value && typeof value === 'object' && 'heroTitle' in value && 'heroBody' in value && 'version' in value);
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请稍后重试。';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}).format(date);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function releaseKindLabel(kind: Release['kind']): string {
  return {
    home: '网站首页',
    article: '文章',
    pages: '其他页面',
    products: '产品中心',
    formats: '膜型',
    credentials: '专利与创新'
  }[kind];
}
