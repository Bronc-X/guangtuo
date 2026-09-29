import path from 'node:path';

export type SourceSegment = {location: string; text: string};
export type ParsedDocument = {segments: SourceSegment[]; warnings: string[]};
const maxCharacters = 500_000;

function checkZip(bytes: Buffer) {
  const start = Math.max(0, bytes.length - 65_557);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= start; offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new Error('INVALID_DOCUMENT');
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16); let expanded = 0;
  if (count > 2000 || !count || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)) throw new Error('DOCUMENT_ARCHIVE_LIMIT');
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error('INVALID_DOCUMENT');
    if (bytes.readUInt16LE(offset + 8) & 1) throw new Error('ENCRYPTED_DOCUMENT');
    const size = bytes.readUInt32LE(offset + 24);
    expanded += size;
    if (size > 32 * 1024 * 1024 || expanded > 64 * 1024 * 1024) throw new Error('DOCUMENT_ARCHIVE_LIMIT');
    offset += 46 + bytes.readUInt16LE(offset + 28) + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
    if (offset > end) throw new Error('INVALID_DOCUMENT');
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n' || char === '\r')) {
      row.push(cell); cell = '';
      if (char !== ',') {
        if (char === '\r' && text[index + 1] === '\n') index++;
        rows.push(row); row = [];
      }
    } else cell += char;
    if (rows.length > 50_000 || row.length > 200 || cell.length > 20_000) throw new Error('DOCUMENT_TABLE_LIMIT');
  }
  if (quoted) throw new Error('INVALID_CSV');
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

function tableSegments(rows: string[][], label: string): SourceSegment[] {
  if (!rows.length) return [];
  const headers = rows[0];
  const segments: SourceSegment[] = [];
  for (let index = 1; index < rows.length; index += 20) {
    const group = rows.slice(index, index + 20);
    const text = group.map(row => row.map((value, column) => `${headers[column] || `Column ${column + 1}`}: ${value}`).join(' | ')).join('\n');
    if (text.trim()) segments.push({location: `${label} rows ${index === 1 ? 1 : index + 1}-${Math.min(rows.length, index + 20)}`, text});
  }
  if (!segments.length) segments.push({location: `${label} row 1`, text: headers.join(' | ')});
  return segments;
}

export async function parseKnowledgeFile(fileName: string, bytes: Buffer): Promise<ParsedDocument> {
  if (bytes.length > 8 * 1024 * 1024) throw new Error('DOCUMENT_TOO_LARGE');
  if (!bytes.length) throw new Error('EMPTY_DOCUMENT');
  const extension = path.extname(fileName).toLowerCase();
  const warnings: string[] = []; let segments: SourceSegment[] = [];
  if (['.txt', '.md', '.csv'].includes(extension)) {
    let text: string;
    try { text = new TextDecoder('utf-8', {fatal: true}).decode(bytes).replace(/^\uFEFF/, ''); }
    catch { throw new Error('DOCUMENT_ENCODING_UNSUPPORTED'); }
    if (text.includes('\0')) throw new Error('INVALID_DOCUMENT');
    segments = extension === '.csv' ? tableSegments(parseCsv(text), 'CSV') : [{location: 'text', text}];
  } else if (extension === '.pdf') {
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('INVALID_DOCUMENT');
    const {getDocument} = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = getDocument({data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true, useWorkerFetch: false, useWasm: false, stopAtErrors: true, verbosity: 0});
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 100) throw new Error('DOCUMENT_PAGE_LIMIT');
      let characters = 0;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim();
        characters += text.length;
        if (characters > maxCharacters) throw new Error('DOCUMENT_TEXT_LIMIT');
        if (text) segments.push({location: `PDF page ${pageNumber}`, text});
        else warnings.push(`PDF_PAGE_${pageNumber}_NO_TEXT`);
        page.cleanup();
      }
      if (!segments.length) throw new Error('OCR_REQUIRED');
    } catch (error) {
      if (error instanceof Error && /Password/.test(error.name)) throw new Error('ENCRYPTED_DOCUMENT');
      if (error instanceof Error && /^(OCR_REQUIRED|DOCUMENT_)/.test(error.message)) throw error;
      throw new Error('INVALID_DOCUMENT');
    } finally { await task.destroy(); }
  } else if (extension === '.docx') {
    checkZip(bytes);
    try {
      const mammoth = await import('mammoth');
      const extracted = await mammoth.extractRawText({buffer: bytes});
      segments = extracted.value.split(/\n\s*\n/).map((text, index) => ({location: `DOCX paragraph ${index + 1}`, text}));
      if (extracted.messages.length) warnings.push('DOCX_PARSER_WARNINGS_REVIEW_REQUIRED');
    } catch { throw new Error('INVALID_DOCUMENT'); }
  } else if (extension === '.xlsx') {
    checkZip(bytes);
    try {
      const {default: ExcelJS} = await import('exceljs'); const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      if (workbook.worksheets.length > 50) throw new Error('DOCUMENT_TABLE_LIMIT');
      for (const sheet of workbook.worksheets) {
        if (sheet.rowCount > 50_000 || sheet.columnCount > 200) throw new Error('DOCUMENT_TABLE_LIMIT');
        const rows: string[][] = [];
        for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
          const row: string[] = [];
          for (let column = 1; column <= sheet.columnCount; column++) {
            const cell = sheet.getRow(rowNumber).getCell(column);
            if (cell.type === ExcelJS.ValueType.Formula) {
              warnings.push('SPREADSHEET_FORMULAS_NOT_EVALUATED');
              row.push(cell.result == null ? '[formula not evaluated]' : String(cell.result));
            } else row.push(cell.text);
          }
          rows.push(row);
        }
        segments.push(...tableSegments(rows, `XLSX ${sheet.name}`));
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'DOCUMENT_TABLE_LIMIT') throw error;
      throw new Error('INVALID_DOCUMENT');
    }
  } else throw new Error('UNSUPPORTED_DOCUMENT');
  segments = segments.map(segment => ({...segment, text: segment.text.replace(/\0/g, '').trim()})).filter(segment => segment.text);
  if (!segments.length) throw new Error('EMPTY_DOCUMENT');
  if (segments.reduce((total, segment) => total + segment.text.length, 0) > maxCharacters) throw new Error('DOCUMENT_TEXT_LIMIT');
  return {segments, warnings: [...new Set(warnings)]};
}

export function chunkSegments(segments: SourceSegment[]): SourceSegment[] {
  const chunks: SourceSegment[] = [];
  for (const segment of segments) {
    for (let start = 0; start < segment.text.length;) {
      const end = Math.min(segment.text.length, start + 1400);
      chunks.push({location: segment.location, text: segment.text.slice(start, end)});
      if (chunks.length > 500) throw new Error('DOCUMENT_CHUNK_LIMIT');
      if (end === segment.text.length) break;
      start = end - 180;
    }
  }
  return chunks;
}
