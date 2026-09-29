import {createServer} from 'node:http';
import {afterEach, expect, it} from 'vitest';
import {createStudioGateway} from '../services/studio/gateway';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const fn of cleanup.splice(0)) await fn(); });
it('fails closed without credentials, licensing, paid-call enablement or explicit confirmation', async () => {
  const gateway = createStudioGateway({});
  await expect(gateway.health()).rejects.toThrow('STUDIO_NOT_CONFIGURED');
  const disabled = createStudioGateway({STUDIO_GATEWAY_URL: 'http://127.0.0.1:9', STUDIO_GATEWAY_TOKEN: 'test'});
  await expect(disabled.concept({sku: 'GT-JAR-050', prompt: 'A white jar concept', confirmed: true})).rejects.toThrow('STUDIO_GENERATION_DISABLED');
});

it('sends credentials only server-side, rewrites asset URLs, validates assets and never retries failures', async () => {
  const id = 'a'.repeat(32); let calls = 0; let fail = false;
  const server = createServer((req, res) => {
    calls++; expect(req.headers.authorization).toBe('Bearer test-only');
    if (fail) { res.writeHead(502); res.end('secret upstream detail'); return; }
    if (req.method === 'POST') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({id, sku: 'GT-JAR-050', image_url: 'https://evil.example/steal', cached: false})); return; }
    res.end('not a PNG');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  cleanup.push(() => new Promise(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const gateway = createStudioGateway({STUDIO_GATEWAY_URL: `http://127.0.0.1:${(server.address() as {port: number}).port}`, STUDIO_GATEWAY_TOKEN: 'test-only', STUDIO_GENERATION_ENABLED: 'true', STUDIO_LICENSE_ACCEPTED: 'true'});
  await expect(gateway.concept({sku: 'GT-JAR-050', prompt: 'A white jar concept', confirmed: false})).rejects.toThrow('EXTERNAL_PROCESSING_CONFIRMATION_REQUIRED');
  expect(calls).toBe(0);
  expect(await gateway.concept({sku: 'GT-JAR-050', prompt: 'A white jar concept', confirmed: true})).toMatchObject({id, image_url: `/api/cms/studio/concept-images/${id}`});
  await expect(gateway.asset('concept-images', id)).rejects.toThrow('STUDIO_INVALID_ASSET');
  fail = true;
  const before = calls;
  await expect(gateway.concept({sku: 'GT-JAR-050', prompt: 'A white jar concept', confirmed: true})).rejects.toThrow('STUDIO_UPSTREAM_FAILED');
  expect(calls).toBe(before + 1);
});
