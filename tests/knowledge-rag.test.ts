import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterEach, expect, it} from 'vitest';
import {createKnowledgeService} from '../services/knowledge/service';
import {parseKnowledgeFile} from '../services/knowledge/parser';
import {createRagService, type GenerationProvider} from '../services/knowledge/rag';
import {createInquiryService} from '../services/content-admin/inquiries';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const fn of cleanup.splice(0)) await fn(); });
async function setup() {
  const root = await mkdtemp(path.join(tmpdir(), 'gt-rag-'));
  const db = new DatabaseSync(path.join(root, 'test.sqlite'));
  cleanup.push(async () => { db.close(); await rm(root, {recursive: true, force: true}); });
  const knowledge = createKnowledgeService({database: db, dataDir: root, parser: parseKnowledgeFile});
  const doc = await knowledge.ingest({title: 'Jar', fileName: 'jar.txt', bytes: Buffer.from('GT-JAR-050 capacity is 50 ml.'), locale: 'en'}, 'qa');
  const active = knowledge.update(doc.id, doc.version, {status: 'active', visibility: 'customer', reviewed: true}, 'qa');
  const hit = (await knowledge.search({query: 'GT-JAR-050'})).items[0];
  const output = {title: 'Your jar inquiry', body: 'The GT-JAR-050 has a 50 ml capacity. Please confirm your requirements.', citations: [{chunkId: hit.chunkId, quote: 'GT-JAR-050 capacity is 50 ml.'}]};
  return {root, db, knowledge, active, hit, output};
}
const request = {kind: 'mail' as const, query: 'GT-JAR-050 capacity', locale: 'en' as const, sku: 'GT-JAR-050', mode: 'bm25' as const, confirmed: true};

it('requires configuration, external processing consent, and relevant approved evidence', async () => {
  const {knowledge} = await setup();
  await expect(createRagService({knowledge}).generate(request)).rejects.toThrow('RAG_NOT_CONFIGURED');
  let calls = 0;
  const provider: GenerationProvider = {id: 'test', generate: async () => { calls++; return {}; }};
  const rag = createRagService({knowledge, provider});
  await expect(rag.generate({...request, confirmed: false})).rejects.toThrow('EXTERNAL_PROCESSING_CONFIRMATION_REQUIRED');
  await expect(rag.generate({...request, query: 'unrelated zebras', sku: undefined})).rejects.toThrow('NO_RELEVANT_EVIDENCE');
  expect(calls).toBe(0);
});

it('validates exact quotes, rejects invented citations, and rechecks revoked sources after generation', async () => {
  const {knowledge, active, output} = await setup();
  let response: unknown = output;
  const rag = createRagService({knowledge, provider: {id: 'test', generate: async input => { expect(input.instructions).toContain('untrusted'); return response; }}});
  expect(await rag.generate({...request, sku: undefined})).toMatchObject({body: output.body, grounding: {mode: 'bm25', model: 'test'}});
  response = {...output, citations: [{chunkId: 'invented', quote: output.citations[0].quote}]};
  await expect(rag.generate({...request, sku: undefined})).rejects.toThrow('RAG_INVALID_CITATION');
  response = {...output, citations: [{chunkId: output.citations[0].chunkId, quote: 'clinically guaranteed'}]};
  await expect(rag.generate({...request, sku: undefined})).rejects.toThrow('RAG_INVALID_CITATION');
  const revoking = createRagService({knowledge, provider: {id: 'test', generate: async () => { knowledge.update(active.id, active.version, {status: 'archived'}, 'qa'); return output; }}});
  await expect(revoking.generate({...request, sku: undefined})).rejects.toThrow('RAG_SOURCES_STALE');
});

it('stores RAG mail for human review with fixed recipient and blocks stale-source approval/send', async () => {
  const {knowledge, root, db, active, output} = await setup();
  let sends = 0;
  const inquiry = createInquiryService({database: db, dataDir: root, sender: async () => { sends++; return {messageId: 'mock'}; }, validateGrounding: grounding => knowledge.validateCitations(grounding.citations)});
  const input = {name: 'QA', businessEmail: 'buyer@example.test', company: 'QA', market: 'France', category: 'eye', sku: 'GT-JAR-050', configuration: 'White', quantity: '1000', budget: 'Discuss', launchDate: '2027', productGoal: 'Jar', packagingPreference: 'Jar', certificationConstraints: '', notes: '', privacyConsent: true};
  const created = await inquiry.create(input, 'rag-mail-test-1234', 'en');
  const generated = await createRagService({knowledge, provider: {id: 'test', generate: async () => output}}).generate({...request, sku: undefined});
  const draft = inquiry.applyGenerated(created.id, 1, generated, 'qa');
  expect(draft).toMatchObject({generator: 'rag', email: {to: input.businessEmail, status: 'pending_review'}});
  await expect(inquiry.send(created.id, 'qa')).rejects.toThrow('EMAIL_NOT_APPROVED');
  inquiry.approve(created.id, draft.version, 'qa', true);
  knowledge.update(active.id, active.version, {status: 'archived'}, 'qa');
  await expect(inquiry.send(created.id, 'qa')).rejects.toThrow('RAG_SOURCES_STALE');
  const edited = inquiry.edit(created.id, inquiry.get(created.id)!.version, {subject: 'Edited', body: 'Edited'}, 'qa');
  expect(() => inquiry.approve(created.id, edited.version, 'qa', true)).toThrow('RAG_SOURCES_STALE');
  expect(sends).toBe(0);
});
