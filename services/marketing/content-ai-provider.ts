import {z} from 'zod';
import {requestJson, trustedBaseUrl} from '../integrations/http';
import {fetchPublicBytes} from './public-source';

export type ContentAiProvider = {
  configured: boolean; textModel: string; imageModel: string;
  text: (system: string, input: string) => Promise<unknown>;
  image: (prompt: string, reference?: {bytes: Buffer; mime: string}) => Promise<Buffer>;
};
export function createContentAiProvider(env: Record<string,string | undefined> = process.env): ContentAiProvider {
  const key = env.CONTENT_AI_API_KEY?.trim();
  const base = trustedBaseUrl(env.CONTENT_AI_BASE_URL ?? 'https://testvideo.site/v1', 'CONTENT_AI');
  const textModel = env.CONTENT_AI_TEXT_MODEL?.trim() || 'gpt-5.6-sol', imageModel = env.CONTENT_AI_IMAGE_MODEL?.trim() || 'gpt-image-2';
  const requireKey = () => {if (!key) throw new Error('尚未配置内容 AI 服务');};
  return {
    configured: Boolean(key), textModel, imageModel,
    async text(system, input) {
      requireKey();
      const raw = await requestJson(base + '/chat/completions', {token: key!, prefix: 'CONTENT_AI', timeoutMs: 180000, maxBytes: 2_000_000,
        body: {model: textModel, messages: [{role: 'system', content: system}, {role: 'user', content: input}], max_completion_tokens: 6000, response_format: {type: 'json_object'}}});
      const response = z.object({choices: z.array(z.object({finish_reason: z.string().nullable().optional(), message: z.object({content: z.string().nullable(), refusal: z.string().nullable().optional()})})).min(1)}).parse(raw);
      const choice = response.choices[0];
      if (choice.finish_reason === 'length' || choice.message.refusal || !choice.message.content) throw new Error('AI 未返回完整内容，请调整提示词后重试');
      try {return JSON.parse(choice.message.content.replace(/^```(?:json)?\s*|\s*```$/g, ''));} catch {throw new Error('AI 返回格式不完整，请重试');}
    },
    async image(prompt, reference) {
      requireKey();
      let raw: unknown;
      if (reference) {
        const body = new FormData();
        body.set('model', imageModel); body.set('prompt', prompt); body.set('n', '1'); body.set('size', '1024x1024');
        body.set('image', new Blob([new Uint8Array(reference.bytes)], {type: reference.mime}), reference.mime === 'image/jpeg' ? 'reference.jpg' : reference.mime === 'image/webp' ? 'reference.webp' : 'reference.png');
        const response = await fetch(base + '/images/edits', {method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000), headers: {Authorization: `Bearer ${key}`}, body});
        if (!response.ok) {await response.body?.cancel(); throw new Error(`参考图二创请求失败（${response.status}），请检查服务额度或模型支持`);}
        const reader = response.body?.getReader(); if (!reader) throw new Error('图片服务返回空响应');
        const chunks: Buffer[] = []; let size = 0;
        for (;;) {const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > 30_000_000) {await reader.cancel(); throw new Error('图片响应过大');} chunks.push(Buffer.from(next.value));}
        try {raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw new Error('图片响应格式不正确');}
      } else {
        raw = await requestJson(base + '/images/generations', {token: key!, prefix: 'CONTENT_AI', timeoutMs: 300000, maxBytes: 30_000_000, body: {model: imageModel, prompt, n: 1, size: '1024x1024'}});
      }
      const image = z.object({data: z.array(z.object({b64_json: z.string().optional(), url: z.string().optional()})).min(1)}).parse(raw).data[0];
      if (image.b64_json) return Buffer.from(image.b64_json, 'base64');
      if (image.url) return (await fetchPublicBytes(image.url, 20_000_000, 30000)).bytes;
      throw new Error('图片服务没有返回图片');
    }
  };
}
