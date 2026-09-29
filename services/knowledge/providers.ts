import {createHash} from 'node:crypto';
import {z} from 'zod';
import {requestJson, trustedBaseUrl} from '../integrations/http';
import {cosineSimilarity} from './retrieval';
import type {EmbeddingProvider} from './service';
import type {GenerationProvider} from './rag';

export function createAiProviders(env: Record<string, string | undefined> = process.env): {embeddings?: EmbeddingProvider; generator?: GenerationProvider} {
  const key = env.RAG_API_KEY?.trim();
  if (!key) return {embeddings: undefined, generator: undefined};
  const base = trustedBaseUrl(env.RAG_API_BASE_URL ?? 'https://api.openai.com/v1', 'AI');
  const model = env.RAG_MODEL?.trim(); const embeddingModel = env.RAG_EMBEDDING_MODEL?.trim();
  const dimensions = env.RAG_EMBEDDING_DIMENSIONS ? Number(env.RAG_EMBEDDING_DIMENSIONS) : undefined;
  if (dimensions !== undefined && (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > 4096)) throw new Error('AI_INVALID_CONFIGURATION');
  const post = (route: string, body: unknown) => requestJson(`${base}${route}`, {token: key, prefix: 'AI', body, maxBytes: 8 * 1024 * 1024, timeoutMs: 60_000});
  const embeddings: EmbeddingProvider | undefined = embeddingModel ? {
    // Credential rotations do not invalidate vectors; endpoint/model/dimension changes do.
    id: createHash('sha256').update(JSON.stringify([base, embeddingModel, dimensions ?? 'default'])).digest('hex'),
    async embed(texts) {
      if (!texts.length || texts.length > 32 || texts.some(text => !text || text.length > 8000)) throw new Error('INVALID_EMBEDDING_INPUT');
      const raw = await post('/embeddings', {model: embeddingModel, input: texts, encoding_format: 'float', ...(dimensions ? {dimensions} : {})});
      const parsed = z.object({data: z.array(z.object({index: z.number().int().nonnegative(), embedding: z.array(z.number().finite()).min(1).max(4096)}))}).safeParse(raw);
      if (!parsed.success || parsed.data.data.length !== texts.length) throw new Error('INVALID_EMBEDDING_RESPONSE');
      const ordered = parsed.data.data.sort((a, b) => a.index - b.index);
      try {
        ordered.forEach((item, index) => { if (item.index !== index || item.embedding.length !== (dimensions ?? ordered[0].embedding.length)) throw new Error(); cosineSimilarity(item.embedding, item.embedding); });
      } catch { throw new Error('INVALID_EMBEDDING_RESPONSE'); }
      return ordered.map(item => item.embedding);
    }
  } : undefined;
  const generator: GenerationProvider | undefined = model ? {
    id: model,
    async generate(request) {
      const raw = await post('/responses', {model, store: false, tools: [], instructions: request.instructions, input: request.input, max_output_tokens: 4000, text: {format: {type: 'json_schema', name: 'grounded_draft', strict: true, schema: request.schema}}});
      const parsed = z.object({status: z.literal('completed'), output: z.array(z.object({type: z.string(), content: z.array(z.object({type: z.string(), text: z.string().optional()})).optional()}))}).safeParse(raw);
      if (!parsed.success) throw new Error('AI_RESPONSE_REJECTED');
      const content = parsed.data.output.flatMap(item => item.content ?? []);
      if (content.some(item => item.type === 'refusal')) throw new Error('AI_RESPONSE_REJECTED');
      const text = content.filter(item => item.type === 'output_text').map(item => item.text ?? '').join('');
      try { return JSON.parse(text) as unknown; } catch { throw new Error('AI_INVALID_RESPONSE'); }
    }
  } : undefined;
  return {embeddings, generator};
}
