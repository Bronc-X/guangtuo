import {z} from 'zod';
export const aboutTextFields = {
  profileTitle: z.string().max(200).optional(), profileBody: z.string().max(5000).optional(),
  videoId: z.string().regex(/^(?:[A-Za-z0-9_-]{11})?$/).optional(),
  videoSource: z.union([z.url().refine(value => value.startsWith('https://')), z.literal('')]).optional(), videoSourceLabel: z.string().max(100).optional(),
  contactEmail: z.union([z.email(), z.literal('')]).optional(), contactWhatsapp: z.string().max(100).optional(), contactWechat: z.string().max(100).optional(),
  contactInstagram: z.string().max(100).regex(/^[A-Za-z0-9._]*$/).optional(), contactTiktok: z.string().max(100).regex(/^[A-Za-z0-9._]*$/).optional(), contactFacebook: z.string().max(200).optional()
};
