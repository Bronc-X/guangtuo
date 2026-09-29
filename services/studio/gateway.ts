import {z} from 'zod';
import {studioConceptRequest, studioId, studioJobRequest, type StudioConcept, type StudioJob} from '../../src/lib/studio-admin-contracts';
import {requestBytes, requestJson, trustedBaseUrl} from '../integrations/http';

export function createStudioGateway(env: Record<string, string | undefined> = process.env) {
  const token = env.STUDIO_GATEWAY_TOKEN?.trim();
  const base = env.STUDIO_GATEWAY_URL ? trustedBaseUrl(env.STUDIO_GATEWAY_URL, 'STUDIO') : undefined;
  const configured = Boolean(token && base);
  const generationEnabled = configured && env.STUDIO_GENERATION_ENABLED === 'true' && env.STUDIO_LICENSE_ACCEPTED === 'true';
  const requireConfiguration = () => { if (!configured) throw new Error('STUDIO_NOT_CONFIGURED'); };
  const requireGeneration = (confirmed: boolean) => {
    requireConfiguration();
    if (!generationEnabled) throw new Error('STUDIO_GENERATION_DISABLED');
    if (!confirmed) throw new Error('EXTERNAL_PROCESSING_CONFIRMATION_REQUIRED');
  };
  const json = (route: string, body?: unknown) => { requireConfiguration(); return requestJson(`${base}${route}`, {token: token!, prefix: 'STUDIO', body, maxBytes: 256_000, timeoutMs: body ? 250_000 : 15_000}); };
  const parse = <T>(schema: z.ZodType<T>, raw: unknown): T => { const result = schema.safeParse(raw); if (!result.success) throw new Error('STUDIO_INVALID_RESPONSE'); return result.data; };
  const job = (raw: unknown): StudioJob => {
    const value = parse(z.object({id: studioId, sku: z.string().max(64), status: z.enum(['queued', 'preparing', 'generating', 'finalizing', 'completed', 'failed']), progress: z.number().min(0).max(100), cached: z.boolean()}), raw);
    return {...value, model_url: value.status === 'completed' ? `/api/cms/studio/jobs/${value.id}/model` : null, error: value.status === 'failed' ? 'STUDIO_JOB_FAILED' : null};
  };
  return {
    configured, generationEnabled,
    async health() { return parse(z.object({ready: z.boolean(), image_ready: z.boolean(), model_ready: z.boolean(), busy: z.boolean(), estimated_wait_seconds: z.number().nonnegative()}), await json('/health')); },
    async concept(input: unknown): Promise<StudioConcept> {
      const {confirmed, ...request} = studioConceptRequest.parse(input); requireGeneration(confirmed);
      const result = parse(z.object({id: studioId, sku: z.string(), cached: z.boolean()}), await json('/concept-images', request));
      if (result.sku !== request.sku) throw new Error('STUDIO_INVALID_RESPONSE');
      return {...result, image_url: `/api/cms/studio/concept-images/${result.id}`};
    },
    async createJob(input: unknown) {
      const {confirmed, ...request} = studioJobRequest.parse(input); requireGeneration(confirmed);
      const result = job(await json('/jobs', request));
      if (result.sku !== request.sku) throw new Error('STUDIO_INVALID_RESPONSE');
      return result;
    },
    async getJob(id: string) { const result = job(await json(`/jobs/${studioId.parse(id)}`)); if (result.id !== id) throw new Error('STUDIO_INVALID_RESPONSE'); return result; },
    async asset(kind: 'concept-images' | 'jobs', id: string) {
      requireConfiguration(); studioId.parse(id);
      const bytes = await requestBytes(`${base}/${kind}/${id}${kind === 'jobs' ? '/model' : ''}`, {token: token!, prefix: 'STUDIO', maxBytes: 50 * 1024 * 1024, timeoutMs: 30_000});
      const valid = kind === 'jobs' ? bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'glTF' && bytes.readUInt32LE(4) === 2 && bytes.readUInt32LE(8) === bytes.length : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (!valid) throw new Error('STUDIO_INVALID_ASSET');
      return {bytes, contentType: kind === 'jobs' ? 'model/gltf-binary' : 'image/png'};
    }
  };
}
export type StudioGateway = ReturnType<typeof createStudioGateway>;
