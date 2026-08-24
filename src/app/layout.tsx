import type {Metadata} from 'next';
import {Cormorant_Garamond, Manrope, Noto_Sans_SC} from 'next/font/google';
import './globals.css';

const bodyLatin = Manrope({subsets: ['latin'], variable: '--font-sans-latin'});
const bodyCjk = Noto_Sans_SC({subsets: ['latin'], variable: '--font-sans-cjk', weight: ['400', '500', '600', '700']});
const displayLatin = Cormorant_Garamond({subsets: ['latin'], variable: '--font-display-latin', weight: ['500', '600', '700']});

export const metadata: Metadata = {
  title: {default: 'Guangtuo Bio | Finished Masks & Hydrogel Development', template: '%s | Guangtuo Bio'},
  description: 'Finished facial, eye and neck masks, hydrogel formats, custom product development, sampling and production coordination.',
  robots: {index: true, follow: true}
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bodyLatin.variable} ${bodyCjk.variable} ${displayLatin.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
