import type {ContentAiJob} from './content-ai-contracts';

export const aiSteps = ['brief', 'prompts', 'copy', 'image', 'review'] as const;
export type AiStep = typeof aiSteps[number];
export const aiIsRunning = (job?: ContentAiJob) => Boolean(job && ['planning', 'writing', 'imaging'].includes(job.state));
export function suggestedAiStep(job?: ContentAiJob): AiStep {
  if (!job) return 'brief';
  if (job.state === 'planning' || job.state === 'failed' && job.errorStep === 'plan') return 'prompts';
  if (job.state === 'writing' || job.state === 'failed' && job.errorStep === 'write') return 'copy';
  if (job.state === 'imaging' || job.state === 'failed' && job.errorStep === 'image') return 'image';
  if (job.adopted || job.output && job.imageMediaId) return 'review';
  if (job.output) return 'image';
  if (job.prompts) return 'prompts';
  return 'brief';
}
export function restoreAiJob(jobs: ContentAiJob[], requested: string | null) {
  if (requested === 'new') return undefined;
  return jobs.find(job => job.id === requested) ?? jobs.find(aiIsRunning) ?? jobs.find(job => !job.adopted) ?? jobs[0];
}
export function aiStepAvailable(step: AiStep, job?: ContentAiJob) {
  return step === 'brief' || step === 'prompts' && Boolean(job) || (step === 'copy' || step === 'image') && Boolean(job?.prompts) || step === 'review' && Boolean(job?.output && job?.imageMediaId);
}
// Keep only view identifiers in the URL. Content and credentials remain in the CMS.
export function workspaceParam(key: string): string | null {
  return typeof window === 'undefined' ? null : new URL(window.location.href).searchParams.get(key);
}
export function rememberWorkspace(values: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {if (value === null) url.searchParams.delete(key); else url.searchParams.set(key, value);}
  window.history.replaceState(window.history.state, '', url);
}
