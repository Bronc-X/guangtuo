import type {MetadataRoute} from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.invalid';
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/inquiry/', '/*/recommend/', '/*/proposal/', '/*/status/', '/*/studio/', '/*/ui-lab/']
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
