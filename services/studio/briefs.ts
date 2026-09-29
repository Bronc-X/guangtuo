import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {GroundedDraft} from '../knowledge/rag';
import type {KnowledgeService} from '../knowledge/service';

export function createStudioBriefs(db: DatabaseSync, knowledge: KnowledgeService) {
  db.exec('CREATE TABLE IF NOT EXISTS studio_briefs (id TEXT PRIMARY KEY, sku TEXT NOT NULL, record_json TEXT NOT NULL, actor TEXT NOT NULL) STRICT');
  return {
    save(sku: string, draft: GroundedDraft, actor: string) {
      knowledge.validateCitations(draft.grounding.citations);
      if ((db.prepare('SELECT COUNT(*) AS n FROM studio_briefs').get() as {n: number}).n >= 1000) throw new Error('STUDIO_BRIEF_CAPACITY_EXCEEDED');
      const record = {id: randomUUID(), sku, ...draft};
      db.prepare('INSERT INTO studio_briefs VALUES (?,?,?,?)').run(record.id, sku, JSON.stringify(record), actor);
      return record;
    },
    validate(id: string, sku: string, prompt: string) {
      const row = db.prepare('SELECT record_json FROM studio_briefs WHERE id=?').get(id) as {record_json: string} | undefined;
      if (!row) throw new Error('STUDIO_BRIEF_NOT_FOUND');
      const record = JSON.parse(row.record_json) as GroundedDraft & {sku: string};
      if (record.sku !== sku || record.body !== prompt) throw new Error('STUDIO_BRIEF_MISMATCH');
      knowledge.validateCitations(record.grounding.citations);
    }
  };
}
