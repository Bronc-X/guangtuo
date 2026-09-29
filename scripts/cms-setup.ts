import {homedir} from 'node:os';
import path from 'node:path';

import {setupContentAdmin} from '../services/content-admin/setup';

const username = process.env.CMS_ADMIN_USERNAME;
const password = process.env.CMS_ADMIN_PASSWORD;
const dataDir = process.env.CMS_DATA_DIR ?? path.join(homedir(), '.guangtuo-cms');

if (!username) throw new Error('Set CMS_ADMIN_USERNAME before running cms:setup');
if (!password) throw new Error('Set CMS_ADMIN_PASSWORD before running cms:setup; no default password is provided');

setupContentAdmin({
  dataDir,
  username,
  password,
  displayName: process.env.CMS_ADMIN_NAME,
  publishedContentPath: process.env.CMS_PUBLISHED_CONTENT_PATH ?? path.resolve('content/published-content.json')
});

process.stdout.write(`CMS administrator created in ${dataDir}\n`);
