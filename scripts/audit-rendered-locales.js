// Run in the local site's browser with gstack browse eval. Read-only HTTP GETs.
(async () => {
  const locales = ['en', 'zh', 'ar'];
  const core = ['', 'about', 'contact', 'customization', 'factory', 'how-it-works', 'inquiry', 'insights', 'patents', 'products', 'proposal', 'recommend', 'status', 'studio', 'ui-lab'];
  const productDoc = new DOMParser().parseFromString(await (await fetch('/en/products/')).text(), 'text/html');
  const details = [...new Set([...productDoc.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(href => /^\/en\/(products|categories)\/[^/]+\/$/.test(href)))].map(href => href.replace(/^\/en\//, '').replace(/\/$/, ''));
  const routes = locales.flatMap(locale => [...core, ...details].map(path => `/${locale}/${path ? `${path}/` : ''}`));
  for (const locale of locales) {
    const insightsDoc = new DOMParser().parseFromString(await (await fetch(`/${locale}/insights/`)).text(), 'text/html');
    routes.push(...new Set([...insightsDoc.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(href => new RegExp(`^/${locale}/insights/[^/]+/$`).test(href))));
  }
  window.__localeAudit = {startedAt: new Date().toISOString(), total: routes.length, completed: 0, results: []};
  let index = 0;
  async function worker() {
    while (index < routes.length) {
      const path = routes[index++];
      try {
        const response = await fetch(path, {signal: AbortSignal.timeout(60000)});
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        doc.querySelectorAll('script,style,nextjs-portal').forEach(e => e.remove());
        const main = doc.querySelector('main') ?? doc.body;
        const links = [...new Set([...doc.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(href => href.startsWith('/')))];
        const textNodes = [...main.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim()).map(e => e.textContent.trim());
        window.__localeAudit.results.push({path, status: response.status, title: doc.title, description: doc.querySelector('meta[name="description"]')?.content,
          rawLang: doc.documentElement.lang, rawDir: doc.documentElement.dir,
          headings: [...main.querySelectorAll('h1,h2,h3')].map(e => e.textContent.trim()),
          latinOnly: [...new Set(textNodes.filter(text => /[a-z]{3}/i.test(text) && !/[\u0600-\u06ff\u3400-\u9fff]/.test(text)))],
          cjk: [...new Set(textNodes.filter(text => /[\u3400-\u9fff]/.test(text)))],
          ariaLabels: [...new Set([...doc.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')))], links});
      } catch (error) {
        window.__localeAudit.results.push({path, error: String(error)});
      }
      window.__localeAudit.completed++;
    }
  }
  window.__localeAuditWork = Promise.all(Array.from({length: 4}, worker)).then(() => { window.__localeAudit.finishedAt = new Date().toISOString(); });
  return {started: true, routes: routes.length};
})()
