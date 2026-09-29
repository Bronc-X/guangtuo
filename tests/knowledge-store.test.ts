import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterEach, expect, it} from 'vitest';
import {createKnowledgeService} from '../services/knowledge/service';
import {parseKnowledgeFile} from '../services/knowledge/parser';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const fn of cleanup.splice(0)) await fn(); });
async function setup(embedding = false) {
  const root = await mkdtemp(path.join(tmpdir(), 'gt-knowledge-'));
  const db = new DatabaseSync(path.join(root, 'private.sqlite'));
  cleanup.push(async () => { db.close(); await rm(root, {recursive: true, force: true}); });
  const provider = embedding ? {id: 'local-test-v1', embed: async (texts: string[]) => texts.map(text => text.includes('hydrogel') || text.includes('hydrating') ? [1, 0] : [0, 1])} : undefined;
  return {db, service: createKnowledgeService({database: db, dataDir: root, parser: parseKnowledgeFile, embeddings: provider})};
}

it('keeps uploads private and out of customer search until explicitly approved', async () => {
  const {service} = await setup();
  const doc = await service.ingest({title: 'Eye specification', fileName: 'eye.md', bytes: Buffer.from('GT-EYE-001 hydrogel 眼膜 保湿'), locale: 'zh', skus: ['GT-EYE-001']}, 'admin');
  expect(doc).toMatchObject({status: 'draft', visibility: 'internal', parseState: 'ready', version: 1});
  expect(service.contents(doc.id)).toMatchObject({document: {id: doc.id}, chunks: [{text: 'GT-EYE-001 hydrogel 眼膜 保湿'}]});
  expect((await service.search({query: 'GT-EYE-001', mode: 'bm25', audience: 'customer'})).items).toHaveLength(0);
  const active = service.update(doc.id, 1, {status: 'active', visibility: 'customer', reviewed: true}, 'admin');
  const hits = await service.search({query: 'GT-EYE-001', mode: 'bm25', audience: 'customer', locale: 'zh', sku: 'GT-EYE-001'});
  expect(hits.items[0]).toMatchObject({documentId: doc.id, version: active.version, title: doc.title, location: 'text'});
  expect((await service.search({query: 'GT-EYE-001', mode: 'bm25', audience: 'customer', sku: 'WRONG'})).items).toHaveLength(0);
  service.update(doc.id, active.version, {status: 'archived'}, 'admin');
  expect((await service.search({query: 'GT-EYE-001', mode: 'bm25', audience: 'customer'})).items).toHaveLength(0);
  expect(() => service.validateCitations(hits.items)).toThrow('RAG_SOURCES_STALE');
});

it('implements vector retrieval with explicit configuration and index gates', async () => {
  const missing = await setup();
  await expect(missing.service.search({query: 'eye', mode: 'hybrid', audience: 'customer'})).rejects.toThrow('EMBEDDINGS_NOT_CONFIGURED');
  const {service} = await setup(true);
  const doc = await service.ingest({title: 'Eye', fileName: 'eye.txt', bytes: Buffer.from('hydrogel'), locale: 'en', skus: []}, 'admin');
  const active = service.update(doc.id, doc.version, {status: 'active', visibility: 'customer', reviewed: true}, 'admin');
  await expect(service.search({query: 'hydrating', mode: 'hybrid', audience: 'customer'})).rejects.toThrow('VECTOR_INDEX_INCOMPLETE');
  await service.indexDocument(active.id, active.version, true, 'admin');
  const result = await service.search({query: 'hydrating', mode: 'hybrid', audience: 'customer'});
  expect(result).toMatchObject({mode: 'hybrid', embeddingProfile: 'local-test-v1'});
  expect(result.items[0].documentId).toBe(doc.id);
});

it('retains a failed parsing record but never indexes it or lets it be activated', async () => {
  const {service} = await setup();
  const doc = await service.ingest({title: 'Bad PDF', fileName: 'bad.pdf', bytes: Buffer.from('%PDF-broken'), locale: 'zh', skus: []}, 'admin');
  expect(doc.parseState).toBe('failed');
  expect(doc.error).toBeTruthy();
  expect(() => service.update(doc.id, doc.version, {status: 'active', visibility: 'customer', reviewed: true}, 'admin')).toThrow('DOCUMENT_NOT_PARSED');
});
