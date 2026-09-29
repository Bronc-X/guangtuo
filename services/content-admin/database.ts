import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

import {publishedContentSchema} from '../../src/lib/published-content-schema';
import {managedContentSeeds} from '../../src/data/content-admin-seeds';
import type {
  ArticleFields,
  HomeFields,
  ManagedContentFieldsByKind,
  ManagedContentKind,
  PublishedContentSnapshot
} from '../../src/lib/content-admin-contracts';

export const databaseFileName = 'content-admin.sqlite';

export type ContentDocumentRow = {
  id: string;
  kind: 'home' | 'article';
  slug: string;
  draft_json: string;
  published_json: string | null;
  version: number;
  published_version: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type MediaRow = {
  id: string;
  original_name: string;
  storage_key: string;
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  size_bytes: number;
  width: number;
  height: number;
  created_at: string;
};

export type ManagedContentRow = {
  record_key: string;
  id: string;
  kind: ManagedContentKind;
  label: string;
  sort_order: number;
  draft_json: string;
  published_json: string | null;
  version: number;
  published_version: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type StoredManagedFields<Kind extends ManagedContentKind = ManagedContentKind> =
  ManagedContentFieldsByKind[Kind] & {legacyImage?: string; legacyPdf?: string};

export type StoredHomeFields = HomeFields & {legacyHeroImage: string};
export type StoredArticleFields = ArticleFields & {legacyCover: string};

const initialHome: StoredHomeFields = {
  heroTitle: '',
  heroBody: '',
  heroMediaId: null,
  legacyHeroImage: '/assets/hydrogel/eye-mask-hero.jpg'
};

export function openContentAdminDatabase(dataDir: string): DatabaseSync {
  mkdirSync(dataDir, {recursive: true, mode: 0o700});
  const database = new DatabaseSync(path.join(dataDir, databaseFileName));
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA synchronous = FULL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      csrf_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS content_documents (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('home', 'article')),
      slug TEXT NOT NULL UNIQUE,
      draft_json TEXT NOT NULL,
      published_json TEXT,
      version INTEGER NOT NULL,
      published_version INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS content_revisions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES content_documents(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(document_id, version)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      storage_key TEXT NOT NULL UNIQUE,
      mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
      size_bytes INTEGER NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('home', 'article')),
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('building', 'live', 'failed')),
      message TEXT,
      created_at TEXT NOT NULL,
      published_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      subject_id TEXT,
      created_at TEXT NOT NULL,
      detail_json TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS managed_content_records (
      record_key TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('pages', 'products', 'formats', 'credentials')),
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      draft_json TEXT NOT NULL,
      published_json TEXT,
      version INTEGER NOT NULL,
      published_version INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      UNIQUE(kind, id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS managed_content_revisions (
      id TEXT PRIMARY KEY,
      record_key TEXT NOT NULL REFERENCES managed_content_records(record_key) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(record_key, version)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS managed_content_releases (
      id TEXT PRIMARY KEY,
      record_key TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('pages', 'products', 'formats', 'credentials')),
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('building', 'live', 'failed')),
      message TEXT,
      created_at TEXT NOT NULL,
      published_at TEXT NOT NULL
    ) STRICT;
  `);

  const mediaSchema = database.prepare("SELECT sql FROM sqlite_master WHERE name = 'media_assets'").get() as {sql: string};
  if (!mediaSchema.sql.includes('application/pdf')) {
    database.exec(`BEGIN IMMEDIATE;
      ALTER TABLE media_assets RENAME TO media_assets_before_pdf;
      CREATE TABLE media_assets (
        id TEXT PRIMARY KEY, original_name TEXT NOT NULL, storage_key TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','application/pdf')),
        size_bytes INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, created_at TEXT NOT NULL
      ) STRICT;
      INSERT INTO media_assets SELECT * FROM media_assets_before_pdf;
      DROP TABLE media_assets_before_pdf;
      COMMIT;`);
  }
  const now = new Date().toISOString();
  database.prepare(`
    INSERT OR IGNORE INTO content_documents (
      id, kind, slug, draft_json, published_json, version, published_version, created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, NULL, 0, NULL, ?, ?, NULL)
  `).run('home', 'home', 'home', JSON.stringify(initialHome), now, now);

  const insertManaged = database.prepare(`
    INSERT OR IGNORE INTO managed_content_records (
      record_key, id, kind, label, sort_order, draft_json, published_json,
      version, published_version, created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NULL, ?, ?, NULL)
  `);
  for (const seed of managedContentSeeds) {
    insertManaged.run(`${seed.kind}:${seed.id}`, seed.id, seed.kind, seed.label, seed.sortOrder, JSON.stringify(seed.fields), now, now);
  }
  return database;
}

export function getDocument(database: DatabaseSync, id: string): ContentDocumentRow | undefined {
  return database.prepare('SELECT * FROM content_documents WHERE id = ?').get(id) as ContentDocumentRow | undefined;
}

export function getArticleRows(database: DatabaseSync): ContentDocumentRow[] {
  return database.prepare("SELECT * FROM content_documents WHERE kind = 'article' ORDER BY updated_at DESC, id DESC").all() as ContentDocumentRow[];
}

export function parseHomeFields(json: string): StoredHomeFields {
  return JSON.parse(json) as StoredHomeFields;
}

export function parseArticleFields(json: string): StoredArticleFields {
  return JSON.parse(json) as StoredArticleFields;
}

export function getMedia(database: DatabaseSync, id: string): MediaRow | undefined {
  return database.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as MediaRow | undefined;
}

export function getManagedContentRows(database: DatabaseSync, kind: ManagedContentKind): ManagedContentRow[] {
  return database.prepare(`
    SELECT * FROM managed_content_records WHERE kind = ? ORDER BY sort_order ASC, id ASC
  `).all(kind) as ManagedContentRow[];
}

export function getManagedContentRow(database: DatabaseSync, kind: ManagedContentKind, id: string): ManagedContentRow | undefined {
  return database.prepare('SELECT * FROM managed_content_records WHERE kind = ? AND id = ?').get(kind, id) as ManagedContentRow | undefined;
}

export function parseManagedFields<Kind extends ManagedContentKind>(json: string): StoredManagedFields<Kind> {
  return JSON.parse(json) as StoredManagedFields<Kind>;
}

export function importPublishedSnapshotIfPristine(
  database: DatabaseSync,
  publishedContentPath: string
): boolean {
  if (!existsSync(publishedContentPath)) return false;
  const snapshot = publishedContentSchema.parse(JSON.parse(readFileSync(publishedContentPath, 'utf8')));
  const importedManaged = importManagedSnapshotOverrides(database, snapshot);
  const home = getDocument(database, 'home');
  const articleCount = database.prepare("SELECT COUNT(*) AS count FROM content_documents WHERE kind = 'article'").get() as {count: number};
  if (!home || home.version !== 0 || home.published_json !== null || articleCount.count !== 0) return importedManaged;

  database.exec('BEGIN IMMEDIATE');
  try {
    if (snapshot.home) {
      const storedHome: StoredHomeFields = {
        textStyles: snapshot.home.textStyles,
        heroTitle: snapshot.home.heroTitle,
        heroBody: snapshot.home.heroBody,
        heroMediaId: null,
        legacyHeroImage: snapshot.home.heroImage
      };
      const content = JSON.stringify(storedHome);
      database.prepare(`
        UPDATE content_documents
        SET draft_json = ?, published_json = ?, version = 1, published_version = 1, updated_at = ?, published_at = ?
        WHERE id = 'home'
      `).run(content, content, snapshot.publishedAt, snapshot.publishedAt);
      database.prepare(`
        INSERT INTO content_revisions (id, document_id, version, content_json, created_at)
        VALUES (?, 'home', 1, ?, ?)
      `).run(`seed:${snapshot.releaseId}:home`, content, snapshot.publishedAt);
    }

    const insertArticle = database.prepare(`
      INSERT INTO content_documents (
        id, kind, slug, draft_json, published_json, version, published_version, created_at, updated_at, published_at
      ) VALUES (?, 'article', ?, ?, ?, 1, 1, ?, ?, ?)
    `);
    const insertRevision = database.prepare(`
      INSERT INTO content_revisions (id, document_id, version, content_json, created_at)
      VALUES (?, ?, 1, ?, ?)
    `);
    for (const article of snapshot.articles) {
      const storedArticle: StoredArticleFields = {
        textStyles: article.textStyles,
        title: article.title,
        summary: article.summary,
        body: article.body,
        category: article.category,
        coverMediaId: null,
        legacyCover: article.cover
      };
      const content = JSON.stringify(storedArticle);
      insertArticle.run(article.id, article.slug, content, content, article.publishedAt, article.publishedAt, article.publishedAt);
      insertRevision.run(`seed:${snapshot.releaseId}:${article.id}`, article.id, content, article.publishedAt);
    }
    database.exec('COMMIT');
    return true;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function importManagedSnapshotOverrides(database: DatabaseSync, snapshot: PublishedContentSnapshot): boolean {
  const records: Array<{kind: ManagedContentKind; id: string; fields: StoredManagedFields}> = [
    ...(snapshot.pageOverrides ?? []).map((item) => ({
      kind: 'pages' as const,
      id: item.pageId,
      fields: {textStyles: item.textStyles, heroTitle: item.heroTitle, heroBody: item.heroBody}
    })),
    ...(snapshot.productOverrides ?? []).map((item) => ({
      kind: 'products' as const,
      id: item.productId,
      fields: {
        textStyles: item.textStyles,
        name: item.name,
        description: item.description,
        highlights: item.highlights.join('\n'),
        applications: item.applications.join('\n'),
        netWeight: item.netWeight,
        packFormat: item.packFormat,
        moqQuantity: item.moqQuantity,
        moqUnit: item.moqUnit,
        imageMediaId: null,
        legacyImage: item.image
      }
    })),
    ...(snapshot.formatOverrides ?? []).map((item) => ({
      kind: 'formats' as const,
      id: item.formatId,
      fields: {
        textStyles: item.textStyles,
        name: item.name,
        effects: item.effects,
        specification: item.specification,
        moq: item.moq,
        packaging: item.packaging,
        imageMediaId: null,
        legacyImage: item.image
      }
    })),
    ...(snapshot.credentialOverrides ?? []).map((item) => ({
      kind: 'credentials' as const,
      id: item.credentialId,
      fields: {
        textStyles: item.textStyles,
        title: item.title,
        kind: item.kind,
        number: item.number,
        rightsholder: item.rightsholder,
        imageMediaId: null,
        legacyImage: item.image,
        legacyPdf: item.pdf
      }
    }))
  ];
  let imported = false;
  database.exec('BEGIN IMMEDIATE');
  try {
    const update = database.prepare(`
      UPDATE managed_content_records
      SET draft_json = ?, published_json = ?, version = 1, published_version = 1, updated_at = ?, published_at = ?
      WHERE kind = ? AND id = ? AND version = 0 AND published_json IS NULL
    `);
    const revision = database.prepare(`
      INSERT OR IGNORE INTO managed_content_revisions (id, record_key, version, content_json, created_at)
      VALUES (?, ?, 1, ?, ?)
    `);
    for (const record of records) {
      const content = JSON.stringify(record.fields);
      const result = update.run(content, content, snapshot.publishedAt, snapshot.publishedAt, record.kind, record.id);
      if (Number(result.changes) !== 1) continue;
      imported = true;
      revision.run(`seed:${snapshot.releaseId}:${record.kind}:${record.id}`, `${record.kind}:${record.id}`, content, snapshot.publishedAt);
    }

    // The built-in catalog is already live in the static site even when the
    // published snapshot has no overrides. Mark untouched seed rows as the
    // published baseline so the migrated CMS reflects the actual website.
    const pristineRows = database.prepare(`
      SELECT record_key, draft_json, version
      FROM managed_content_records
      WHERE version = 0 AND published_json IS NULL
    `).all() as Array<{record_key: string; draft_json: string; version: number}>;
    const publishSeed = database.prepare(`
      UPDATE managed_content_records
      SET published_json = draft_json, published_version = version, published_at = ?
      WHERE record_key = ? AND version = 0 AND published_json IS NULL
    `);
    const seedRevision = database.prepare(`
      INSERT OR IGNORE INTO managed_content_revisions (id, record_key, version, content_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const row of pristineRows) {
      const result = publishSeed.run(snapshot.publishedAt, row.record_key);
      if (Number(result.changes) !== 1) continue;
      imported = true;
      seedRevision.run(`seed:${snapshot.releaseId}:${row.record_key}`, row.record_key, row.version, row.draft_json, snapshot.publishedAt);
    }
    database.exec('COMMIT');
    return imported;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
