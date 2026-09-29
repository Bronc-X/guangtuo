import type {Metadata} from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/noto-sans-sc';
import '@fontsource-variable/cormorant-garamond';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.invalid'),
  title: {default: 'Showki Biotech | Finished Masks & Hydrogel Development', template: '%s | Showki Biotech'},
  description: 'Finished face masks, eye masks and targeted hydrogel patches, with custom development, sampling and production coordination.',
  robots: {index: true, follow: true}
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
