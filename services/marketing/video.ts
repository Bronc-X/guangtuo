import {spawn, spawnSync} from 'node:child_process';
import {mkdir, writeFile, rename} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export function videoAvailable() {return spawnSync(process.env.MARKETING_FFMPEG_PATH || 'ffmpeg', ['-version'], {windowsHide: true, timeout: 5000, stdio: 'ignore'}).status === 0;}
export const escapeXml = (value: string) => value.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c]!));
export function captionLines(value: string): string[] {
  return value.split(/\r?\n/).flatMap(line => {
    const result: string[] = []; let part = ''; let width = 0;
    for (const char of line) {const next = /[\u0000-\u00ff]/u.test(char) ? 1 : 2; if (width + next > 30) {result.push(part); part = ''; width = 0;} part += char; width += next;}
    result.push(part); return result;
  });
}
export async function renderMarketingVideo(directory: string, image: Buffer, scenes: string[]) {
  await mkdir(directory, {recursive: true});
  const product = await sharp(image).resize(640, 700, {fit: 'contain', background: '#f7f4ed'}).png().toBuffer();
  for (const [index, text] of scenes.entries()) {
    const lines = captionLines(text);
    if (lines.length > 7) throw new Error('字幕过长，请缩短每个分镜的文字。');
    const svg = `<svg width="720" height="1280" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="1280" fill="#f7f4ed"/><text x="48" y="66" font-family="sans-serif" font-size="24" fill="#242725">SHOWKI BIOTECH</text><rect y="820" width="720" height="460" fill="#202426"/>${lines.map((line, i) => `<text x="48" y="${898 + i * 42}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="32" fill="#ffffff">${escapeXml(line)}</text>`).join('')}<text x="48" y="1240" font-family="sans-serif" font-size="18" fill="#e0b1c8">${index + 1} / ${scenes.length} · showkibiotech.com</text></svg>`;
    await sharp(Buffer.from(svg)).composite([{input: product, left: 40, top: 96}]).png().toFile(path.join(directory, `frame-${index}.png`));
  }
  const list = scenes.map((_, i) => `file 'frame-${i}.png'\nduration 6`).join('\n') + `\nfile 'frame-${scenes.length - 1}.png'\n`;
  await writeFile(path.join(directory, 'frames.txt'), list);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.env.MARKETING_FFMPEG_PATH || 'ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '1', '-i', 'frames.txt', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', String(scenes.length * 6), '-vf', 'fps=24', '-c:v', 'libx264', '-threads', '1', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', 'video.pending.mp4'], {cwd: directory, windowsHide: true, stdio: 'ignore'});
    const timer = setTimeout(() => {child.kill();}, 180_000);
    child.once('error', () => {clearTimeout(timer); reject(new Error('无法启动 FFmpeg，请检查视频合成环境。'));});
    child.once('close', code => {clearTimeout(timer); if(code === 0) resolve(); else reject(new Error('视频合成失败，请检查 FFmpeg 和字体配置后重试。'));});
  });
  await rename(path.join(directory, 'video.pending.mp4'), path.join(directory, 'video.mp4'));
}
