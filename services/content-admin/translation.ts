import {spawn} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {contentStrings, targetLocales} from '../../src/lib/content-localization';
import {publishedContentSchema, type PublishedContentSnapshot} from '../../src/lib/published-content-schema';

export type TranslationRequest = {text: string; target: string};
export type TranslateBatch = (requests: TranslationRequest[]) => Promise<string[]>;
export type PrepareTranslations = (snapshot: PublishedContentSnapshot) => Promise<PublishedContentSnapshot>;

function translationRevision(): string {
  const project = process.env.CMS_PROJECT_DIR ?? process.cwd();
  return createHash('sha256').update('argos-1.11-cpu-int8-v2')
    .update(readFileSync(path.join(project, 'services/translation/worker.py')))
    .update(readFileSync(path.join(project, 'services/translation/glossary.json')))
    .update(readFileSync(path.join(project, 'content/maintained-translations.json'))).digest('hex');
}

export function assertCompleteTranslations(snapshot: PublishedContentSnapshot): void {
  for (const locale of targetLocales) for (const text of contentStrings(snapshot)) {
    if (!snapshot.translations?.[locale]?.[text]?.trim()) throw new Error(`缺少${locale}译文，全部语言均未发布。`);
  }
}

export function needsTranslationUpgrade(snapshotPath: string): boolean {
  if (!existsSync(snapshotPath)) return true;
  const snapshot = publishedContentSchema.parse(JSON.parse(readFileSync(snapshotPath, 'utf8')));
  if (!snapshot.translations || snapshot.translationRevision !== translationRevision()) return true;
  try {assertCompleteTranslations(snapshot); return false;} catch {return true;}
}

export function createTranslationPreparer(dataDir: string, translate: TranslateBatch = translateWithArgos): PrepareTranslations {
  return async snapshot => {
    const revision = translationRevision();
    const existing = JSON.parse(readFileSync(path.join(process.env.CMS_PROJECT_DIR ?? process.cwd(), 'content/maintained-translations.json'), 'utf8')) as Record<string, Partial<Record<typeof targetLocales[number], string>>>;
    const texts = contentStrings(snapshot);
    const translations: NonNullable<PublishedContentSnapshot['translations']> = {en: {}, fr: {}, es: {}, ru: {}, ar: {}};
    const missing: TranslationRequest[] = [];
    const cacheDir = path.join(dataDir, 'translations', revision);
    await mkdir(cacheDir, {recursive: true});
    const cachePath = ({text, target}: TranslationRequest) => path.join(cacheDir, createHash('sha256').update(JSON.stringify([target, text])).digest('hex') + '.json');
    for (const target of targetLocales) for (const text of texts) {
      let value = snapshot.translationRevision === revision ? snapshot.translations?.[target]?.[text] : undefined;
      value ??= Object.hasOwn(existing, text) ? existing[text][target] : undefined;
      if (!value) {
        try {value = JSON.parse(await readFile(cachePath({text, target}), 'utf8')) as string;}
        catch (error) {if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('翻译缓存无法读取，请检查服务日志后重试。');}
      }
      if (typeof value === 'string' && value.trim()) translations[target][text] = value;
      else missing.push({text, target});
    }
    if (missing.length) {
      const results = await translate(missing);
      if (results.length !== missing.length) throw new Error('翻译结果不完整，全部语言均未发布。');
      for (const [index, request] of missing.entries()) {
        const value = results[index];
        if (typeof value !== 'string' || !value.trim() || /[\u3400-\u9fff]/u.test(value) || /<\/?[a-z][^>]*>/i.test(value)) throw new Error(`翻译校验失败（${request.target}），草稿已保留。`);
        const numbers = request.text.match(/\d+(?:[.,]\d+)*/g) ?? [];
        if (numbers.some(number => !value.includes(number))) throw new Error(`译文中的数字不一致（${request.target}），草稿已保留。`);
        translations[request.target as keyof typeof translations][request.text] = value;
        const destination = cachePath(request);
        const temporary = `${destination}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(value), {mode: 0o600});
        await rename(temporary, destination);
      }
    }
    const result = publishedContentSchema.parse({...snapshot, translations, translationRevision: revision});
    assertCompleteTranslations(result);
    return result;
  };
}

export const translateWithArgos: TranslateBatch = async requests => {
  const project = process.env.CMS_PROJECT_DIR ?? process.cwd();
  const python = process.env.CMS_TRANSLATION_PYTHON ?? path.join(project, '.venv-translation', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  if (!existsSync(python)) throw new Error('免费翻译引擎尚未安装，请运行翻译安装脚本；草稿已保留，网站未更新。');
  return new Promise((resolve, reject) => {
    const env: NodeJS.ProcessEnv = {NODE_ENV: process.env.NODE_ENV, PYTHONIOENCODING: 'utf-8', ARGOS_DEVICE_TYPE: 'cpu'};
    for (const [key, value] of Object.entries(process.env)) {
      if (/^(PATH|SystemRoot|TEMP|TMP|USERPROFILE|HOME|LANG|XDG_DATA_HOME|XDG_CACHE_HOME|XDG_CONFIG_HOME|ARGOS_PACKAGES_DIR)$/i.test(key)) env[key] = value;
    }
    const child = spawn(python, [path.join(project, 'services/translation/worker.py')], {windowsHide: true, env});
    let output = '';
    let timedOut = false;
    const timer = setTimeout(() => {timedOut = true; child.kill();}, 30 * 60_000);
    child.stdout.on('data', chunk => {output += String(chunk); if (output.length > 32_000_000) child.kill();});
    // Engine diagnostics may include text; never forward them to public API responses.
    child.stderr.resume();
    child.stdin.on('error', () => { /* Process close reports the installation/engine failure. */ });
    child.once('error', () => {clearTimeout(timer); reject(new Error('无法启动翻译引擎，请检查 Python 配置。'));});
    child.once('close', code => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(timedOut ? '翻译超时，草稿已保留，请重试。' : '翻译引擎运行失败，请检查语言模型安装；草稿已保留。'));
      try {const result: unknown = JSON.parse(output); if (!Array.isArray(result) || result.some(item => typeof item !== 'string')) throw new Error(); resolve(result);}
      catch {reject(new Error('翻译引擎返回无效结果，网站未更新。'));}
    });
    child.stdin.end(JSON.stringify(requests));
  });
};
