import {z} from 'zod';
import type {InquiryInput, JobStatus} from '@/lib/contracts';

type Fetcher = typeof fetch;

const publicJobSchema = z.object({
  id: z.string().min(1).max(100),
  status: z.enum(['queued', 'processing', 'completed', 'retryable_error', 'failed']),
  retryCount: z.number().int().min(0).max(2),
  updatedAt: z.number()
});

const createdJobSchema = publicJobSchema.extend({accessToken: z.string().min(12).max(512)});

export type RemoteJob = {id: string; status: JobStatus; retryCount: number; updatedAt: number};

function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export async function createRemoteInquiry(baseUrl: string, input: InquiryInput, fetcher: Fetcher = fetch) {
  const response = await fetcher(apiUrl(baseUrl, '/inquiries'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()},
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error('Inquiry submission failed');
  const parsed = createdJobSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('Invalid API response');
  return {id: parsed.data.id, status: parsed.data.status, accessToken: parsed.data.accessToken};
}

export async function getRemoteStatus(baseUrl: string, id: string, accessToken: string, fetcher: Fetcher = fetch): Promise<RemoteJob> {
  const response = await fetcher(apiUrl(baseUrl, `/inquiries/${encodeURIComponent(id)}/status`), {
    headers: {Authorization: `Bearer ${accessToken}`}
  });
  if (!response.ok) throw new Error('Status request failed');
  const parsed = publicJobSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('Invalid API response');
  return parsed.data;
}
