import {assertCompleteTranslations, type PrepareTranslations} from './translation';
import {createHash, randomUUID} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {DatabaseSync} from 'node:sqlite';

import {publishedContentSchema, type PublishedContentSnapshot} from '../../src/lib/published-content-schema';
import type {
  ManagedCredentialFields,
  ManagedFormatFields,
  ManagedPageFields,
  ManagedProductFields
} from '../../src/lib/content-admin-contracts';
import {recordAudit} from './audit';
import {
  getArticleRows,
  getDocument,
  getMedia,
  parseArticleFields,
  parseHomeFields,
  parseManagedFields,
  type ContentDocumentRow,
  type ManagedContentRow,
  type MediaRow
} from './database';
import {copyMediaToPublic} from './media';

export class PublishError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export type DeployRelease = (release: {releaseId: string; snapshotPath: string; mediaDir: string}) => Promise<void>;

export function registerDocumentPublish(database: DatabaseSync, document: ContentDocumentRow, now: string): string {
  const releaseId = randomUUID();
  const title = document.kind === 'home' ? '首页' : parseArticleFields(document.draft_json).title.trim() || '未命名文章';
  database.prepare(`
    INSERT INTO releases (id, document_id, kind, title, status, message, created_at, published_at)
    VALUES (?, ?, ?, ?, 'building', NULL, ?, ?)
  `).run(releaseId, document.id, document.kind, title, now, now);
  return releaseId;
}

export function registerManagedContentPublish(database: DatabaseSync, record: ManagedContentRow, now: string): string {
  const releaseId = randomUUID();
  database.prepare(`
    INSERT INTO managed_content_releases (id, record_key, kind, title, status, message, created_at, published_at)
    VALUES (?, ?, ?, ?, 'building', NULL, ?, ?)
  `).run(releaseId, record.record_key, record.kind, managedRecordTitle(record), now, now);
  return releaseId;
}

export function markInterruptedPublishes(database: DatabaseSync): void {
  // A restarted single-instance CMS cannot still own an in-progress build.
  // Do not infer whether the static switch happened: keep drafts and ask for a version check.
  const message = '上次发布因服务中断而结束。草稿已保留，请核对线上版本后重新发布。';
  database.exec('BEGIN IMMEDIATE');
  try {
    for (const table of ['releases', 'managed_content_releases']) {
      database.prepare(`UPDATE ${table} SET status = 'failed', message = ? WHERE status = 'building'`).run(message);
    }
    database.exec('COMMIT');
  } catch (error) {database.exec('ROLLBACK'); throw error;}
}

async function deployCandidate(options: {dataDir: string; publicUploadDir: string; deployRelease?: DeployRelease}, snapshot: PublishedContentSnapshot) {
  if (!options.deployRelease) throw new PublishError(503, 'DEPLOY_NOT_CONFIGURED', '尚未配置构建部署服务；草稿已保留，未发布到网站');
  const snapshotPath = path.join(options.dataDir, 'release-candidates', `${snapshot.releaseId}.json`);
  await writeSnapshotAtomically(snapshotPath, snapshot);
  await options.deployRelease({releaseId: snapshot.releaseId, snapshotPath, mediaDir: options.publicUploadDir});
}

export async function publishDocument(options: {
  database: DatabaseSync;
  document: ContentDocumentRow;
  dataDir: string;
  publicUploadDir: string;
  publishedContentPath: string;
  now: string;
  prepareTranslations: PrepareTranslations;
  deployRelease?: DeployRelease;
  releaseId?: string;
}): Promise<void> {
  const {database, document, now} = options;
  const releaseId = options.releaseId ?? registerDocumentPublish(database, document, now);

  const createdPublicMedia: string[] = [];
  let snapshotWritten = false;
  let deployed = false;
  try {
    const {snapshot: sourceSnapshot, referencedMedia} = buildSnapshot({...options, releaseId});
    let snapshot: PublishedContentSnapshot;
    try { snapshot = await options.prepareTranslations(sourceSnapshot); assertCompleteTranslations(snapshot); }
    catch (error) { throw new PublishError(503, 'TRANSLATION_FAILED', error instanceof Error ? error.message : '翻译失败，草稿已保留'); }
    for (const media of referencedMedia) {
      const copied = await copyMediaToPublic(options.dataDir, options.publicUploadDir, media);
      if (copied.created) createdPublicMedia.push(copied.filePath);
    }
    // Validate the destination before switching any live release.
    await mkdir(path.dirname(options.publishedContentPath), {recursive: true});
    await deployCandidate(options, snapshot);
    deployed = true;
    await writeSnapshotAtomically(options.publishedContentPath, snapshot);
    snapshotWritten = true;

    database.exec('BEGIN IMMEDIATE');
    try {
      const update = database.prepare(`
        UPDATE content_documents
        SET published_json = draft_json, published_version = version, published_at = ?
        WHERE id = ? AND version = ?
      `).run(now, document.id, document.version);
      if (Number(update.changes) !== 1) {
        throw new PublishError(409, 'VERSION_CONFLICT', '内容在发布期间发生变化，请重新检查后发布');
      }
      database.prepare(`
        INSERT OR IGNORE INTO content_revisions (id, document_id, version, content_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), document.id, document.version, document.draft_json, now);
      database.prepare("UPDATE releases SET status = 'live', message = NULL WHERE id = ?").run(releaseId);
      recordAudit(database, `${document.kind}.publish`, document.id, {result: 'success', version: document.version, releaseId}, now);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (!snapshotWritten && !deployed) {
      await Promise.all(createdPublicMedia.map((filePath) => unlink(filePath).catch(() => undefined)));
    }
    const message = deployed ? '网站已部署，但发布记录同步失败；请检查服务日志和发布版本' : error instanceof PublishError ? error.message : '构建或部署失败，上一版网站保持不变';
    database.prepare("UPDATE releases SET status = 'failed', message = ? WHERE id = ?").run(message, releaseId);
    recordAudit(database, `${document.kind}.publish`, document.id, {result: 'failure', version: document.version, releaseId}, now);
    if (error instanceof PublishError) throw error;
    throw new PublishError(500, deployed ? 'PUBLISH_SYNC_FAILED' : 'PUBLISH_FAILED', message);
  }
}

export async function publishManagedContent(options: {
  database: DatabaseSync;
  record: ManagedContentRow;
  dataDir: string;
  publicUploadDir: string;
  publishedContentPath: string;
  now: string;
  prepareTranslations: PrepareTranslations;
  deployRelease?: DeployRelease;
  releaseId?: string;
}): Promise<void> {
  const {database, record, now} = options;
  const releaseId = options.releaseId ?? registerManagedContentPublish(database, record, now);

  const createdPublicMedia: string[] = [];
  let snapshotWritten = false;
  let deployed = false;
  try {
    const {snapshot: sourceSnapshot, referencedMedia} = buildManagedSnapshot({...options, releaseId});
    let snapshot: PublishedContentSnapshot;
    try { snapshot = await options.prepareTranslations(sourceSnapshot); assertCompleteTranslations(snapshot); }
    catch (error) { throw new PublishError(503, 'TRANSLATION_FAILED', error instanceof Error ? error.message : '翻译失败，草稿已保留'); }
    for (const media of referencedMedia) {
      const copied = await copyMediaToPublic(options.dataDir, options.publicUploadDir, media);
      if (copied.created) createdPublicMedia.push(copied.filePath);
    }
    await mkdir(path.dirname(options.publishedContentPath), {recursive: true});
    await deployCandidate(options, snapshot);
    deployed = true;
    await writeSnapshotAtomically(options.publishedContentPath, snapshot);
    snapshotWritten = true;

    database.exec('BEGIN IMMEDIATE');
    try {
      const update = database.prepare(`
        UPDATE managed_content_records
        SET published_json = draft_json, published_version = version, published_at = ?
        WHERE record_key = ? AND version = ?
      `).run(now, record.record_key, record.version);
      if (Number(update.changes) !== 1) {
        throw new PublishError(409, 'VERSION_CONFLICT', '内容在发布期间发生变化，请重新检查后发布');
      }
      database.prepare(`
        INSERT OR IGNORE INTO managed_content_revisions (id, record_key, version, content_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), record.record_key, record.version, record.draft_json, now);
      database.prepare("UPDATE managed_content_releases SET status = 'live', message = NULL WHERE id = ?").run(releaseId);
      recordAudit(database, `${record.kind}.publish`, record.id, {result: 'success', version: record.version, releaseId}, now);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (!snapshotWritten && !deployed) await Promise.all(createdPublicMedia.map((filePath) => unlink(filePath).catch(() => undefined)));
    const message = deployed ? '网站已部署，但发布记录同步失败；请检查服务日志和发布版本' : error instanceof PublishError ? error.message : '构建或部署失败，上一版网站保持不变';
    database.prepare("UPDATE managed_content_releases SET status = 'failed', message = ? WHERE id = ?").run(message, releaseId);
    recordAudit(database, `${record.kind}.publish`, record.id, {result: 'failure', version: record.version, releaseId}, now);
    if (error instanceof PublishError) throw error;
    throw new PublishError(500, deployed ? 'PUBLISH_SYNC_FAILED' : 'PUBLISH_FAILED', message);
  }
}

function buildSnapshot(options: {
  database: DatabaseSync;
  document: ContentDocumentRow;
  releaseId: string;
  now: string;
  publishedContentPath: string;
}): {snapshot: PublishedContentSnapshot; referencedMedia: MediaRow[]} {
  const {database, document: target, now} = options;
  const referencedMedia = new Map<string, MediaRow>();
  const homeRow = getDocument(database, 'home');
  if (!homeRow) throw new PublishError(500, 'HOME_NOT_FOUND', '首页内容不存在');
  const homeJson = target.id === 'home' ? target.draft_json : homeRow.published_json;
  let home: PublishedContentSnapshot['home'] = null;
  if (homeJson) {
    const fields = parseHomeFields(homeJson);
    const heroImage = resolveImageReference(fields.heroMediaId, fields.legacyHeroImage, database, referencedMedia);
    home = {textStyles: fields.textStyles, heroTitle: fields.heroTitle.trim(), heroBody: fields.heroBody.trim(), heroImage};
  }

  const articles: PublishedContentSnapshot['articles'] = [];
  for (const row of getArticleRows(database)) {
    const contentJson = target.id === row.id ? target.draft_json : row.published_json;
    if (!contentJson) continue;
    const fields = parseArticleFields(contentJson);
    const cover = resolveImageReference(fields.coverMediaId, fields.legacyCover, database, referencedMedia);
    articles.push({
      id: row.id,
      slug: row.slug,
      textStyles: fields.textStyles,
      title: fields.title.trim(),
      summary: fields.summary.trim(),
      body: fields.body.trim(),
      category: fields.category.trim(),
      cover,
      publishedAt: target.id === row.id ? now : row.published_at ?? now
    });
  }
  articles.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

  const candidate = {
    schemaVersion: 1 as const,
    releaseId: options.releaseId,
    publishedAt: now,
    home,
    articles,
    ...managedCollectionsFromSnapshot(options.publishedContentPath),
    translations: loadExistingSnapshot(options.publishedContentPath)?.translations,
    translationRevision: loadExistingSnapshot(options.publishedContentPath)?.translationRevision
  };
  const parsed = publishedContentSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new PublishError(422, 'PUBLISH_VALIDATION_FAILED', '发布内容未通过完整性检查');
  }
  return {snapshot: parsed.data, referencedMedia: [...referencedMedia.values()]};
}

function buildManagedSnapshot(options: {
  database: DatabaseSync;
  record: ManagedContentRow;
  releaseId: string;
  now: string;
  publishedContentPath: string;
}): {snapshot: PublishedContentSnapshot; referencedMedia: MediaRow[]} {
  const current = loadExistingSnapshot(options.publishedContentPath) ?? {
    schemaVersion: 1 as const,
    releaseId: options.releaseId,
    publishedAt: options.now,
    home: null,
    articles: [],
    pageOverrides: [],
    productOverrides: [],
    formatOverrides: [],
    credentialOverrides: []
  };
  const referencedMedia = new Map<string, MediaRow>();
  const collections = {
    pageOverrides: [...current.pageOverrides],
    productOverrides: [...current.productOverrides],
    formatOverrides: [...current.formatOverrides],
    credentialOverrides: [...current.credentialOverrides]
  };

  if (options.record.kind === 'pages') {
    const fields = parseManagedFields<'pages'>(options.record.draft_json) as ManagedPageFields;
    const {wechatQrMediaId, whatsappQrMediaId, tiktokQrMediaId, ...pageFields} = fields;
    const previousPage = collections.pageOverrides.find(page => page.pageId === options.record.id);
    collections.pageOverrides = replaceManaged(collections.pageOverrides, 'pageId', {
      ...pageFields,
      ...(wechatQrMediaId ? {wechatQr: resolveImageReference(wechatQrMediaId, '', options.database, referencedMedia)} : previousPage?.wechatQr ? {wechatQr: previousPage.wechatQr} : {}),
      ...(whatsappQrMediaId ? {whatsappQr: resolveImageReference(whatsappQrMediaId, '', options.database, referencedMedia)} : previousPage?.whatsappQr ? {whatsappQr: previousPage.whatsappQr} : {}),
      ...(tiktokQrMediaId ? {tiktokQr: resolveImageReference(tiktokQrMediaId, '', options.database, referencedMedia)} : previousPage?.tiktokQr ? {tiktokQr: previousPage.tiktokQr} : {}),
      pageId: options.record.id,
      heroTitle: fields.heroTitle.trim(),
      heroBody: fields.heroBody.trim()
    });
  } else if (options.record.kind === 'products') {
    const fields = parseManagedFields<'products'>(options.record.draft_json) as ManagedProductFields & {legacyImage?: string};
    collections.productOverrides = replaceManaged(collections.productOverrides, 'productId', {
      productId: options.record.id,
      textStyles: fields.textStyles,
      name: fields.name.trim(),
      description: fields.description.trim(),
      highlights: splitLines(fields.highlights),
      applications: splitLines(fields.applications),
      netWeight: fields.netWeight.trim(),
      packFormat: fields.packFormat.trim(),
      moqQuantity: fields.moqQuantity,
      moqUnit: fields.moqUnit,
      image: resolveImageReference(fields.imageMediaId, fields.legacyImage ?? '', options.database, referencedMedia)
    });
  } else if (options.record.kind === 'formats') {
    const fields = parseManagedFields<'formats'>(options.record.draft_json) as ManagedFormatFields & {legacyImage?: string};
    collections.formatOverrides = replaceManaged(collections.formatOverrides, 'formatId', {
      formatId: options.record.id,
      textStyles: fields.textStyles,
      name: fields.name.trim(),
      effects: fields.effects.trim(),
      specification: fields.specification.trim(),
      moq: fields.moq.trim(),
      packaging: fields.packaging.trim(),
      image: resolveImageReference(fields.imageMediaId, fields.legacyImage ?? '', options.database, referencedMedia)
    });
  } else {
    const fields = parseManagedFields<'credentials'>(options.record.draft_json) as ManagedCredentialFields & {legacyImage?: string; legacyPdf?: string};
    collections.credentialOverrides = replaceManaged(collections.credentialOverrides, 'credentialId', {
      credentialId: options.record.id,
      textStyles: fields.textStyles,
      title: fields.title.trim(),
      kind: fields.kind.trim(),
      number: fields.number.trim(),
      rightsholder: fields.rightsholder.trim(),
      ...(fields.pdfMediaId ? {pdf: resolveImageReference(fields.pdfMediaId, '', options.database, referencedMedia)} : fields.legacyPdf ? {pdf: fields.legacyPdf} : {}),
      image: resolveImageReference(fields.imageMediaId, fields.legacyImage ?? '', options.database, referencedMedia)
    });
  }

  const candidate = {
    ...current,
    ...collections,
    releaseId: options.releaseId,
    publishedAt: options.now
  };
  const parsed = publishedContentSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new PublishError(422, 'PUBLISH_VALIDATION_FAILED', `发布内容未通过完整性检查：${issue?.path.join('.') || '内容'} ${issue?.message || ''}`.trim());
  }
  return {snapshot: parsed.data, referencedMedia: [...referencedMedia.values()]};
}

function loadExistingSnapshot(filePath: string): PublishedContentSnapshot | undefined {
  if (!existsSync(filePath)) return undefined;
  return publishedContentSchema.parse(JSON.parse(readFileSync(filePath, 'utf8')));
}

function managedCollectionsFromSnapshot(filePath: string): Pick<PublishedContentSnapshot, 'pageOverrides' | 'productOverrides' | 'formatOverrides' | 'credentialOverrides'> {
  const snapshot = loadExistingSnapshot(filePath);
  return {
    pageOverrides: snapshot?.pageOverrides ?? [],
    productOverrides: snapshot?.productOverrides ?? [],
    formatOverrides: snapshot?.formatOverrides ?? [],
    credentialOverrides: snapshot?.credentialOverrides ?? []
  };
}

function replaceManaged<Item, Key extends keyof Item>(items: Item[], key: Key, next: Item): Item[] {
  return [...items.filter((item) => item[key] !== next[key]), next];
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function managedRecordTitle(record: ManagedContentRow): string {
  const fields = parseManagedFields(record.draft_json) as Record<string, unknown>;
  for (const key of ['name', 'title', 'heroTitle']) {
    if (typeof fields[key] === 'string' && fields[key].trim()) return fields[key].trim();
  }
  return record.label;
}

function resolveImageReference(
  mediaId: string | null,
  legacyPath: string,
  database: DatabaseSync,
  referencedMedia: Map<string, MediaRow>
): string {
  if (!mediaId) return legacyPath;
  const media = getMedia(database, mediaId);
  if (!media) throw new PublishError(422, 'MEDIA_NOT_FOUND', '发布所需图片不存在');
  referencedMedia.set(media.id, media);
  return `/uploads/cms/${media.storage_key}`;
}

async function writeSnapshotAtomically(filePath: string, snapshot: PublishedContentSnapshot): Promise<void> {
  const directory = path.dirname(filePath);
  await mkdir(directory, {recursive: true});
  const temporary = path.join(directory, `.${path.basename(filePath)}.tmp-${randomUUID()}`);
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  try {
    await writeFile(temporary, serialized, {flag: 'wx', mode: 0o600});
    const digest = createHash('sha256').update(serialized).digest('hex');
    if (!digest) throw new Error('Snapshot digest was not created');
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}
