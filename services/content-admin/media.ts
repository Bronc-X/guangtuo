import {randomUUID} from 'node:crypto';
import {copyFile, mkdir, readFile, rename, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import {PDFArray, PDFDict, PDFDocument, PDFName} from 'pdf-lib';

import type {MediaRow} from './database';

export type ImageLimits = {
  maxImageBytes: number;
  maxImageWidth: number;
  maxImageHeight: number;
  maxImagePixels: number;
};

export class ImageValidationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type DetectedImage = {
  extension: 'jpg' | 'png' | 'webp';
  mimeType: MediaRow['mime_type'];
};

export async function validateAndStoreImage(options: {
  bytes: Buffer;
  fileName: string;
  dataDir: string;
  limits: ImageLimits;
  now: string;
}): Promise<MediaRow> {
  if (options.bytes.length > options.limits.maxImageBytes) {
    throw new ImageValidationError(413, 'IMAGE_TOO_LARGE', '图片文件超过允许大小');
  }
  const detected = detectImage(options.bytes);
  if (!detected) throw new ImageValidationError(415, 'UNSUPPORTED_IMAGE', '仅支持真实的 JPEG、PNG 或 WebP 图片');

  let metadata: {width?: number; height?: number; pages?: number};
  try {
    metadata = await sharp(options.bytes, {
      failOn: 'error',
      limitInputPixels: Math.max(1, Math.floor(options.limits.maxImagePixels))
    }).metadata();
  } catch {
    throw new ImageValidationError(415, 'INVALID_IMAGE', '图片无法完整解码');
  }
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height || (metadata.pages ?? 1) !== 1) {
    throw new ImageValidationError(415, 'INVALID_IMAGE', '图片尺寸无效或包含不支持的动画');
  }
  if (
    width > options.limits.maxImageWidth ||
    height > options.limits.maxImageHeight ||
    width * height > options.limits.maxImagePixels
  ) {
    throw new ImageValidationError(422, 'IMAGE_DIMENSIONS_EXCEEDED', '图片像素尺寸超过允许范围');
  }

  let normalized: Buffer;
  try {
    const pipeline = sharp(options.bytes, {failOn: 'error', limitInputPixels: Math.max(1, Math.floor(options.limits.maxImagePixels))}).rotate();
    normalized = detected.extension === 'jpg'
      ? await pipeline.jpeg({quality: 90, mozjpeg: true}).toBuffer()
      : detected.extension === 'png'
        ? await pipeline.png({compressionLevel: 9}).toBuffer()
        : await pipeline.webp({quality: 90}).toBuffer();
  } catch {
    throw new ImageValidationError(415, 'INVALID_IMAGE', '图片标准化失败');
  }

  const normalizedMetadata = await sharp(normalized).metadata();
  const id = randomUUID();
  const storageKey = `${id}.${detected.extension}`;
  const draftDirectory = path.join(options.dataDir, 'draft-media');
  await mkdir(draftDirectory, {recursive: true, mode: 0o700});
  await writeFile(path.join(draftDirectory, storageKey), normalized, {flag: 'wx', mode: 0o600});

  return {
    id,
    original_name: options.fileName,
    storage_key: storageKey,
    mime_type: detected.mimeType,
    size_bytes: normalized.length,
    width: normalizedMetadata.width ?? width,
    height: normalizedMetadata.height ?? height,
    created_at: options.now
  };
}

export async function readDraftMedia(dataDir: string, media: MediaRow): Promise<Buffer> {
  return readFile(path.join(dataDir, 'draft-media', media.storage_key));
}

export async function validateAndStoreMedia(options: Parameters<typeof validateAndStoreImage>[0]): Promise<MediaRow> {
  if (!options.bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) return validateAndStoreImage(options);
  if (options.bytes.length > options.limits.maxImageBytes) {
    throw new ImageValidationError(413, 'FILE_TOO_LARGE', '文件不能超过 8 MB');
  }
  let normalized: Uint8Array;
  try {
    const pdf = await PDFDocument.load(options.bytes, {throwOnInvalidObject: true, updateMetadata: false});
    if (pdf.isEncrypted || pdf.getPageCount() < 1 || pdf.getPageCount() > 100) throw new Error('Invalid page count or encryption');
    // Inspect decoded objects, including object streams; raw byte matching misses compressed actions.
    const prohibited = new Set(['OpenAction', 'AA', 'A', 'JS', 'JavaScript', 'EmbeddedFiles', 'EF', 'XFA', 'AcroForm', 'RichMedia', 'Launch', 'SubmitForm', 'ImportData']);
    const seen = new Set<unknown>();
    function inspect(value: unknown): void {
      if (seen.has(value)) return;
      seen.add(value);
      if (value instanceof PDFDict) {
        for (const [key, child] of value.entries()) {
          if (prohibited.has(key.decodeText())) throw new Error('Active content');
          inspect(child);
        }
      } else if (value instanceof PDFArray) {
        for (const child of value.asArray()) inspect(child);
      } else if (value instanceof PDFName && prohibited.has(value.decodeText())) throw new Error('Active content');
    }
    for (const [, value] of pdf.context.enumerateIndirectObjects()) inspect(value);
    normalized = await pdf.save();
  } catch {
    throw new ImageValidationError(415, 'INVALID_PDF', 'PDF 无效、加密、超过 100 页或含有交互/脚本；请上传普通证书 PDF');
  }
  const id = randomUUID();
  const storageKey = `${id}.pdf`;
  const directory = path.join(options.dataDir, 'draft-media');
  await mkdir(directory, {recursive: true, mode: 0o700});
  await writeFile(path.join(directory, storageKey), normalized, {flag: 'wx', mode: 0o600});
  return {id, original_name: options.fileName, storage_key: storageKey, mime_type: 'application/pdf', size_bytes: normalized.length, width: 0, height: 0, created_at: options.now};
}

export async function copyMediaToPublic(dataDir: string, publicUploadDir: string, media: MediaRow): Promise<{
  publicPath: string;
  filePath: string;
  created: boolean;
}> {
  const source = path.join(dataDir, 'draft-media', media.storage_key);
  await stat(source);
  await mkdir(publicUploadDir, {recursive: true});
  const destination = path.join(publicUploadDir, media.storage_key);
  let created = false;
  try {
    await stat(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const temporary = path.join(publicUploadDir, `.${media.storage_key}.tmp-${randomUUID()}`);
    try {
      await copyFile(source, temporary);
      await rename(temporary, destination);
      created = true;
    } catch (error) {
      await unlink(temporary).catch(() => undefined);
      throw error;
    }
  }
  return {
    publicPath: `/uploads/cms/${media.storage_key}`,
    filePath: destination,
    created
  };
}

function detectImage(bytes: Buffer): DetectedImage | undefined {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {extension: 'png', mimeType: 'image/png'};
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {extension: 'jpg', mimeType: 'image/jpeg'};
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return {extension: 'webp', mimeType: 'image/webp'};
  }
  return undefined;
}
