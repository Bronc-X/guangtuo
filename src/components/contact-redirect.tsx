'use client';
import Link from 'next/link';
import {useEffect} from 'react';
import type {Locale} from '@/lib/routing';

export function ContactRedirect({locale}: {locale: Locale}) {
  const href = `/${locale}/about/#contact`;
  useEffect(() => {window.location.replace(href);}, [href]);
  return <main className="page-main section"><Link href={href}>{locale === 'zh' ? '前往关于我们' : 'About SHOWKI'}</Link></main>;
}
