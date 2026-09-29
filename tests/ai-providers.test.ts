import {createServer} from 'node:http';
import {afterEach, expect, it} from 'vitest';
import {createAiProviders} from '../services/knowledge/providers';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const fn of cleanup.splice(0)) await fn(); });
async function mock(handler: (url: string, body: Record<string, unknown>, token: string) => {status?: number; body: unknown}) {
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const answer = handler(req.url!, JSON.parse(Buffer.concat(chunks).toString()), req.headers.authorization ?? '');
    res.writeHead(answer.status ?? 200, {'Content-Type': 'application/json'}); res.end(JSON.stringify(answer.body));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  cleanup.push(() => new Promise(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  return `http://127.0.0.1:${(server.address() as {port: number}).port}/v1`;
}

it('does not silently configure missing providers and validates fixed endpoint URLs', () => {
  expect(createAiProviders({})).toMatchObject({embeddings: undefined, generator: undefined});
  expect(() => createAiProviders({RAG_API_BASE_URL: 'http://public.example/v1', RAG_API_KEY: 'test', RAG_MODEL: 'test'})).toThrow('AI_INVALID_CONFIGURATION');
});

it('implements embeddings and strict structured Responses via server-only loopback protocol', async () => {
  const base = await mock((url, body, token) => {
    expect(token).toBe('Bearer test-key');
    if (url.endsWith('/embeddings')) {
      expect(body).toMatchObject({input: ['one', 'two'], model: 'embed-test', encoding_format: 'float'});
      return {body: {data: [{index: 1, embedding: [0, 1]}, {index: 0, embedding: [1, 0]}]}};
    }
    expect(url).toBe('/v1/responses');
    expect(body).toMatchObject({model: 'generation-test', store: false, tools: [], text: {format: {type: 'json_schema', strict: true}}});
    return {body: {status: 'completed', output: [{type: 'message', content: [{type: 'output_text', text: '{"title":"test"}'}]}]}};
  });
  const providers = createAiProviders({RAG_API_BASE_URL: base, RAG_API_KEY: 'test-key', RAG_MODEL: 'generation-test', RAG_EMBEDDING_MODEL: 'embed-test'});
  expect(await providers.embeddings!.embed(['one', 'two'])).toEqual([[1, 0], [0, 1]]);
  expect(await providers.generator!.generate({instructions: 'test', input: '{}', schema: {type: 'object'}})).toEqual({title: 'test'});
});

it('reports sanitized upstream errors and rejects refusals and malformed vectors', async () => {
  let mode = 'error';
  const base = await mock(() => mode === 'error' ? {status: 401, body: {error: 'test-secret'}} : mode === 'refusal' ? {body: {status: 'completed', output: [{type: 'message', content: [{type: 'refusal', refusal: 'No'}]}]}} : {body: {data: [{index: 0, embedding: [0, 0]}]}});
  const providers = createAiProviders({RAG_API_BASE_URL: base, RAG_API_KEY: 'test-key', RAG_MODEL: 'test', RAG_EMBEDDING_MODEL: 'test'});
  await expect(providers.embeddings!.embed(['a'])).rejects.toThrow('AI_AUTH_FAILED');
  mode = 'refusal';
  await expect(providers.generator!.generate({instructions: '', input: '', schema: {}})).rejects.toThrow('AI_RESPONSE_REJECTED');
  mode = 'vectors';
  await expect(providers.embeddings!.embed(['a'])).rejects.toThrow('INVALID_EMBEDDING_RESPONSE');
});
