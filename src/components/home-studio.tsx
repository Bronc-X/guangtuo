'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {localizedPath, type Locale} from '@/lib/routing';
import styles from './home-studio.module.css';

type StudioComponent = typeof import('./sku-3d-studio').Sku3dStudio;

const copy: Record<Locale, {eyebrow: string; title: string; body: string; open: string; loading: string; error: string; retry: string; studio: string}> = {
  en: {eyebrow: '3D PACKAGING STUDIO', title: 'Explore a package before requesting a sample.', body: 'Choose a format, adjust its appearance and turn the model to see it from every side.', open: 'Open 3D studio', loading: 'Loading the 3D studio…', error: 'The 3D studio could not load.', retry: 'Try again', studio: 'Open studio page'},
  zh: {eyebrow: '3D 包装工作台', title: '先在线预览，再确认实物样品。', body: '选择包材、调整外观，并旋转查看造型细节。', open: '打开 3D 工作台', loading: '正在加载 3D 工作台…', error: '3D 工作台加载失败。', retry: '重试', studio: '前往工作台页面'},
  fr: {eyebrow: 'STUDIO EMBALLAGE 3D', title: 'Explorez un emballage avant de demander un échantillon.', body: 'Choisissez un format, adaptez son apparence et examinez le modèle sous tous les angles.', open: 'Ouvrir le studio 3D', loading: 'Chargement du studio 3D…', error: 'Le studio 3D n’a pas pu se charger.', retry: 'Réessayer', studio: 'Ouvrir la page du studio'},
  es: {eyebrow: 'ESTUDIO DE ENVASES 3D', title: 'Explora el envase antes de solicitar una muestra.', body: 'Elige un formato, ajusta su aspecto y gira el modelo para verlo desde todos los ángulos.', open: 'Abrir estudio 3D', loading: 'Cargando el estudio 3D…', error: 'No se pudo cargar el estudio 3D.', retry: 'Reintentar', studio: 'Abrir la página del estudio'},
  ru: {eyebrow: '3D-СТУДИЯ УПАКОВКИ', title: 'Оцените упаковку перед запросом образца.', body: 'Выберите формат, настройте внешний вид и рассмотрите модель со всех сторон.', open: 'Открыть 3D-студию', loading: 'Загрузка 3D-студии…', error: 'Не удалось загрузить 3D-студию.', retry: 'Повторить', studio: 'Открыть страницу студии'},
  ar: {eyebrow: 'استوديو التغليف ثلاثي الأبعاد', title: 'استكشف العبوة قبل طلب العينة.', body: 'اختر التصميم وعدّل المظهر وأدر النموذج لمشاهدته من كل جانب.', open: 'افتح الاستوديو ثلاثي الأبعاد', loading: 'جارٍ تحميل الاستوديو ثلاثي الأبعاد…', error: 'تعذر تحميل الاستوديو ثلاثي الأبعاد.', retry: 'أعد المحاولة', studio: 'افتح صفحة الاستوديو'}
};

export function HomeStudio({locale}: {locale: Locale}) {
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [Studio, setStudio] = useState<StudioComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const c = copy[locale];

  useEffect(() => {
    if (!container.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, {rootMargin: '300px 0px'});
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    import('./sku-3d-studio')
      .then(({Sku3dStudio}) => {
        if (!cancelled) setStudio(() => Sku3dStudio);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [active, attempt]);

  return <div ref={container}>
    {Studio ? <Studio locale={locale} embedded /> : <section className={styles.placeholder} aria-label={c.eyebrow}>
      <div className={styles.content}>
        <p className="eyebrow">{c.eyebrow}</p>
        <h2>{c.title}</h2>
        <p>{c.body}</p>
        {failed ? <div className={styles.actions} role="alert">
          <span>{c.error}</span>
          <button className="button button--primary" type="button" onClick={() => {setFailed(false); setAttempt((value) => value + 1);}}>{c.retry}</button>
          <Link className="button button--ghost" href={localizedPath(locale, 'studio')}>{c.studio}</Link>
        </div> : active ? <p role="status">{c.loading}</p> : <button className="button button--primary" type="button" onClick={() => setActive(true)}>{c.open}</button>}
      </div>
    </section>}
  </div>;
}
