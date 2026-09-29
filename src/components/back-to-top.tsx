'use client';

import {useEffect, useState} from 'react';
import type {Locale} from '@/lib/routing';

const labels: Record<Locale, string> = {
  en: 'Back to top',
  zh: '返回顶部',
  fr: 'Retour en haut',
  es: 'Volver arriba',
  ru: 'Наверх',
  ar: 'العودة إلى الأعلى'
};

export function BackToTop({locale}: {locale: Locale}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 520);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, {passive: true});
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  function returnToTop() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top: 0, behavior: reducedMotion ? 'auto' : 'smooth'});
  }

  return (
    <button
      className={visible ? 'back-to-top back-to-top--visible' : 'back-to-top'}
      type="button"
      aria-label={labels[locale]}
      title={labels[locale]}
      onClick={returnToTop}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
