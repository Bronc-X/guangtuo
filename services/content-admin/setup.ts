import {randomUUID} from 'node:crypto';

import {importPublishedSnapshotIfPristine, openContentAdminDatabase} from './database';
import {hashPassword} from './password';

export type SetupContentAdminOptions = {
  dataDir: string;
  username: string;
  password: string;
  displayName?: string;
  publishedContentPath?: string;
};

export function setupContentAdmin(options: SetupContentAdminOptions): void {
  const username = options.username.trim().toLowerCase();
  if (!options.password) throw new Error('CMS admin password is required');
  if (options.password.length < 12) throw new Error('CMS admin password must contain at least 12 characters');
  if (!/^\S+@\S+\.\S+$/.test(username)) throw new Error('CMS admin username must be an email address');

  const database = openContentAdminDatabase(options.dataDir);
  try {
    if (options.publishedContentPath) importPublishedSnapshotIfPristine(database, options.publishedContentPath);
    const existing = database.prepare('SELECT id FROM admin_users LIMIT 1').get();
    if (existing) throw new Error('CMS admin is already configured');
    const now = new Date().toISOString();
    database.prepare(`
      INSERT INTO admin_users (id, username, display_name, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), username, options.displayName?.trim() || '网站维护人', hashPassword(options.password), now);
  } finally {
    database.close();
  }
}
