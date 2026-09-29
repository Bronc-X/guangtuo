import createNextIntlPlugin from 'next-intl/plugin';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {unoptimized: true},
  // CMS publishing shares a small host with the live API; bound build concurrency.
  experimental: {cpus: 1, webpackMemoryOptimizations: true},
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true
};

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig);
