import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
import {knowledgeMetadata, knowledgeSearch, knowledgeUpdate, type KnowledgeDocument, type KnowledgeHit, type KnowledgeSearchResult, type SourceReference} from '../../src/lib/knowledge-contracts';
import {chunkSegments, type ParsedDocument} from './parser';
import {parseIsolated} from './parse-isolated';
import {cosineSimilarity, rankBm25, reciprocalRankFusion} from './retrieval';

export type EmbeddingProvider = {id: string; embed(texts: string[]): Promise<number[][]>};
type ChunkRow = {id: string; document_id: string; text: string; location: string; record_json: string};

export function createKnowledgeService(options: {database: DatabaseSync; dataDir: string; parser?: (fileName: string, bytes: Buffer) => Promise<ParsedDocument>; embeddings?: EmbeddingProvider; now?: () => number}) {
  const db = options.database; const now = options.now ?? Date.now;
  const parse = options.parser ?? parseIsolated;
  const fileRoot = path.join(options.dataDir, 'knowledge-originals');
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS kb_documents (id TEXT PRIMARY KEY, version INTEGER NOT NULL, status TEXT NOT NULL, visibility TEXT NOT NULL, parse_state TEXT NOT NULL, record_json TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS kb_chunks (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES kb_documents(id), location TEXT NOT NULL, text TEXT NOT NULL) STRICT;
    CREATE INDEX IF NOT EXISTS kb_chunks_document ON kb_chunks(document_id);
    CREATE TABLE IF NOT EXISTS kb_vectors (chunk_id TEXT NOT NULL REFERENCES kb_chunks(id), profile TEXT NOT NULL, vector_json TEXT NOT NULL, PRIMARY KEY(chunk_id, profile)) STRICT;
    CREATE TABLE IF NOT EXISTS kb_events (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, created_at INTEGER NOT NULL) STRICT;`);
  const get = (id: string): KnowledgeDocument => {
    const row = db.prepare('SELECT record_json FROM kb_documents WHERE id=?').get(id) as {record_json: string} | undefined;
    if (!row) throw new Error('DOCUMENT_NOT_FOUND');
    return JSON.parse(row.record_json) as KnowledgeDocument;
  };
  const event = (id: string, action: string, actor: string) => db.prepare('INSERT INTO kb_events VALUES (?,?,?,?,?)').run(randomUUID(), id, action, actor, now());
  const transaction = (action: () => void) => {
    db.exec('BEGIN IMMEDIATE');
    try { action(); db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  const save = (record: KnowledgeDocument) => db.prepare('UPDATE kb_documents SET version=?,status=?,visibility=?,parse_state=?,record_json=? WHERE id=?').run(record.version, record.status, record.visibility, record.parseState, JSON.stringify(record), record.id);
  const requireVersion = (id: string, version: number) => { const record = get(id); if (record.version !== version) throw new Error('VERSION_CONFLICT'); return record; };

  return {
    embeddingConfigured: Boolean(options.embeddings),
    get,
    contents(id: string) {
      const document = get(id);
      const chunks = db.prepare('SELECT location,text FROM kb_chunks WHERE document_id=? ORDER BY rowid').all(id) as Array<{location: string; text: string}>;
      return {document, chunks};
    },
    list(): KnowledgeDocument[] { return (db.prepare('SELECT record_json FROM kb_documents ORDER BY rowid DESC LIMIT 1000').all() as Array<{record_json: string}>).map(row => JSON.parse(row.record_json) as KnowledgeDocument); },
    async original(id: string) { const doc = get(id); return {fileName: doc.fileName, bytes: await readFile(path.join(fileRoot, doc.id))}; },
    async ingest(input: {title: string; fileName: string; bytes: Buffer; locale: string; skus?: string[]}, actor: string): Promise<KnowledgeDocument> {
      const metadata = knowledgeMetadata.parse({title: input.title, locale: input.locale, skus: input.skus});
      if (!input.fileName || input.fileName.length > 200 || input.fileName.includes('\0') || path.posix.basename(input.fileName) !== input.fileName || path.win32.basename(input.fileName) !== input.fileName) throw new Error('INVALID_FILE_NAME');
      if (input.bytes.length > 8 * 1024 * 1024) throw new Error('DOCUMENT_TOO_LARGE');
      if ((db.prepare('SELECT COUNT(*) AS n FROM kb_documents').get() as {n: number}).n >= 1000) throw new Error('KNOWLEDGE_CAPACITY_EXCEEDED');
      const id = randomUUID(); const timestamp = now();
      const doc: KnowledgeDocument = {...metadata, id, version: 1, fileName: input.fileName, sha256: createHash('sha256').update(input.bytes).digest('hex'), status: 'draft', visibility: 'internal', parseState: 'ready', chunkCount: 0, warnings: [], createdAt: timestamp, updatedAt: timestamp};
      await mkdir(fileRoot, {recursive: true, mode: 0o700});
      await writeFile(path.join(fileRoot, id), input.bytes, {flag: 'wx', mode: 0o600});
      let chunks: ReturnType<typeof chunkSegments> = [];
      try {
        const parsed = await parse(input.fileName, input.bytes); chunks = chunkSegments(parsed.segments);
        doc.chunkCount = chunks.length; doc.warnings = parsed.warnings;
      } catch (error) {
        const code = error instanceof Error && /^[A-Z_]{3,80}$/.test(error.message) ? error.message : 'DOCUMENT_PARSE_FAILED';
        doc.parseState = code === 'OCR_REQUIRED' ? 'needs_ocr' : 'failed'; doc.error = code;
      }
      transaction(() => {
        db.prepare('INSERT INTO kb_documents VALUES (?,?,?,?,?,?)').run(id, doc.version, doc.status, doc.visibility, doc.parseState, JSON.stringify(doc));
        for (const chunk of chunks) db.prepare('INSERT INTO kb_chunks VALUES (?,?,?,?)').run(randomUUID(), id, chunk.location, chunk.text);
        event(id, doc.error ? 'parse.failed' : 'document.ingested', actor);
      });
      return doc;
    },
    update(id: string, version: number, input: unknown, actor: string): KnowledgeDocument {
      const record = requireVersion(id, version); const patch = knowledgeUpdate.parse(input);
      const next = {...record, ...patch, version: version + 1, updatedAt: now()};
      delete next.reviewed;
      if (next.status === 'active' && next.parseState !== 'ready') throw new Error('DOCUMENT_NOT_PARSED');
      if (next.status === 'active' && next.visibility === 'customer' && patch.reviewed !== true) throw new Error('DOCUMENT_REVIEW_REQUIRED');
      transaction(() => { save(next); event(id, 'document.updated', actor); });
      return next;
    },
    async indexDocument(id: string, version: number, confirmed: boolean, actor: string) {
      if (!confirmed) throw new Error('EXTERNAL_PROCESSING_CONFIRMATION_REQUIRED');
      if (!options.embeddings) throw new Error('EMBEDDINGS_NOT_CONFIGURED');
      const doc = requireVersion(id, version);
      if (doc.parseState !== 'ready' || doc.status === 'archived') throw new Error('DOCUMENT_NOT_PARSED');
      const chunks = db.prepare('SELECT id,text FROM kb_chunks WHERE document_id=? ORDER BY rowid').all(id) as Array<{id: string; text: string}>;
      const count = (db.prepare('SELECT COUNT(*) AS n FROM kb_vectors v JOIN kb_chunks c ON c.id=v.chunk_id WHERE c.document_id=? AND v.profile=?').get(id, options.embeddings.id) as {n: number}).n;
      if (count === chunks.length && count > 0) return {indexed: count, profile: options.embeddings.id, cached: true};
      const vectors: number[][] = [];
      for (let start = 0; start < chunks.length; start += 32) {
        const batch = chunks.slice(start, start + 32);
        const embedded = await options.embeddings.embed(batch.map(chunk => chunk.text));
        if (embedded.length !== batch.length) throw new Error('INVALID_EMBEDDING_RESPONSE');
        vectors.push(...embedded);
      }
      for (const vector of vectors) {
        cosineSimilarity(vector, vector);
        if (vector.length !== vectors[0].length) throw new Error('VECTOR_DIMENSION_MISMATCH');
      }
      requireVersion(id, version);
      transaction(() => {
        chunks.forEach((chunk, index) => db.prepare('INSERT OR REPLACE INTO kb_vectors VALUES (?,?,?)').run(chunk.id, options.embeddings!.id, JSON.stringify(vectors[index])));
        event(id, 'document.embedded', actor);
      });
      return {indexed: chunks.length, profile: options.embeddings.id, cached: false};
    },
    async search(input: unknown): Promise<KnowledgeSearchResult> {
      const query = knowledgeSearch.parse(input);
      if (query.mode === 'hybrid' && !options.embeddings) throw new Error('EMBEDDINGS_NOT_CONFIGURED');
      const candidates = db.prepare("SELECT c.*,d.record_json FROM kb_chunks c JOIN kb_documents d ON d.id=c.document_id WHERE d.status='active' AND d.parse_state='ready' LIMIT 10001").all() as ChunkRow[];
      if (candidates.length > 10_000) throw new Error('KNOWLEDGE_CAPACITY_EXCEEDED');
      const rows = candidates.filter(row => {
        const doc = JSON.parse(row.record_json) as KnowledgeDocument;
        return (query.audience === 'internal' || doc.visibility === 'customer') && (!query.locale || doc.locale === query.locale) && (!query.sku || doc.skus.includes(query.sku));
      });
      const lexical = rankBm25(query.query, rows.map(row => ({id: row.id, text: `${(JSON.parse(row.record_json) as KnowledgeDocument).title}\n${row.text}`})));
      let ranked = lexical;
      if (query.mode === 'hybrid' && rows.length) {
        const vectors = rows.map(row => {
          const result = db.prepare('SELECT vector_json FROM kb_vectors WHERE chunk_id=? AND profile=?').get(row.id, options.embeddings!.id) as {vector_json: string} | undefined;
          if (!result) throw new Error('VECTOR_INDEX_INCOMPLETE');
          return {id: row.id, vector: JSON.parse(result.vector_json) as number[]};
        });
        const embedded = await options.embeddings!.embed([query.query]);
        if (embedded.length !== 1) throw new Error('INVALID_EMBEDDING_RESPONSE');
        const semantic = vectors.map(vector => ({id: vector.id, score: cosineSimilarity(embedded[0], vector.vector)})).filter(hit => hit.score >= .2).sort((a, b) => b.score - a.score).slice(0, 30);
        ranked = reciprocalRankFusion(lexical, semantic, query.limit);
      }
      const byId = new Map(rows.map(row => [row.id, row]));
      const items: KnowledgeHit[] = [];
      for (const hit of ranked.slice(0, query.limit)) {
        const row = byId.get(hit.id)!; const doc = JSON.parse(row.record_json) as KnowledgeDocument;
        // Metadata can change during an embedding request. Never return a revoked/stale hit.
        if (get(doc.id).version !== doc.version) continue;
        items.push({chunkId: row.id, documentId: doc.id, version: doc.version, title: doc.title, location: row.location, text: row.text, score: hit.score});
      }
      return {mode: query.mode, ...(query.mode === 'hybrid' ? {embeddingProfile: options.embeddings!.id} : {}), items};
    },
    validateCitations(citations: SourceReference[]) {
      if (!citations.length) throw new Error('NO_RELEVANT_EVIDENCE');
      for (const citation of citations) {
        const doc = get(citation.documentId);
        if (doc.version !== citation.version || doc.status !== 'active' || doc.visibility !== 'customer' || doc.parseState !== 'ready' || !db.prepare('SELECT 1 FROM kb_chunks WHERE id=? AND document_id=?').get(citation.chunkId, doc.id)) throw new Error('RAG_SOURCES_STALE');
      }
    }
  };
}
export type KnowledgeService = ReturnType<typeof createKnowledgeService>;
