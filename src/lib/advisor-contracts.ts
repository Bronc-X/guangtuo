import {z} from 'zod';
import {locales} from './routing';

export const advisorMessage = z.object({role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(4000)});
export const advisorRequest = z.object({locale: z.enum(locales), messages: z.array(advisorMessage).min(1).max(79)}).refine(value => value.messages.at(-1)?.role === 'user');
export const advisorBriefKeys = ['productGoal', 'category', 'market', 'salesChannel', 'salesPlatforms', 'efficacy', 'packagingPreference', 'productColor', 'texture', 'quantity', 'budget', 'launchDate', 'certificationConstraints', 'otherNeeds'] as const;
export const advisorBrief = z.object(Object.fromEntries(advisorBriefKeys.map(key => [key, z.string().max(500)])) as Record<typeof advisorBriefKeys[number], z.ZodString>);
export const advisorResponse = z.object({reply: z.string().min(1).max(4000), brief: advisorBrief, suggestions: z.array(z.string().min(1).max(100)).max(4)});
export type AdvisorMessage = z.infer<typeof advisorMessage>;
export type AdvisorBrief = z.infer<typeof advisorBrief>;
