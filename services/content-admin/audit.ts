import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';

export function recordAudit(
  database: DatabaseSync,
  action: string,
  subjectId: string | null,
  detail: Record<string, string | number | boolean | null>,
  createdAt = new Date().toISOString()
): void {
  database.prepare(`
    INSERT INTO audit_events (id, action, subject_id, created_at, detail_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(randomUUID(), action, subjectId, createdAt, JSON.stringify(detail));
}
