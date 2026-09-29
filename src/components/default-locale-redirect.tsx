'use client';

import {useEffect} from 'react';
import {defaultLocale, localizedPath} from '@/lib/routing';

const englishHome = localizedPath(defaultLocale);

export function DefaultLocaleRedirect() {
  useEffect(() => {
    window.location.replace(`${englishHome}${window.location.search}${window.location.hash}`);
  }, []);

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${englishHome}`} />
      <main className="gateway" aria-labelledby="default-locale-title">
        <div className="gateway__wordmark" aria-hidden="true">SHOWKI</div>
        <p className="eyebrow">SHOWKI BIOTECH</p>
        <h1 id="default-locale-title">Continue to the English website</h1>
        <p>If you are not redirected automatically, use the link below.</p>
        <div className="gateway__links">
          <a className="button button--primary" href={englishHome}>Continue in English</a>
        </div>
        <noscript>
          <p>JavaScript is disabled. <a href={englishHome}>Open the English website</a>.</p>
        </noscript>
      </main>
    </>
  );
}
