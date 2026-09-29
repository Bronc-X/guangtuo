import {expect, it} from 'vitest';
import {PDFDocument, StandardFonts} from 'pdf-lib';
import ExcelJS from 'exceljs';
import {crc32} from 'node:zlib';
import {parseKnowledgeFile, chunkSegments} from '../services/knowledge/parser';
import {parseIsolated} from '../services/knowledge/parse-isolated';

function docxFixture() {
  const files = {
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>GT-JAR-050 capacity 50 ml</w:t></w:r></w:p></w:body></w:document>'
  };
  const parts: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const filename = Buffer.from(name); const data = Buffer.from(text); const crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    parts.push(local, filename, data); central.push(directory, filename); offset += local.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(3, 8); end.writeUInt16LE(3, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

it('parses DOCX and bounds archive expansion; production worker parses without service credentials', async () => {
  const fixture = docxFixture();
  expect((await parseKnowledgeFile('jar.docx', fixture)).segments[0]).toMatchObject({location: 'DOCX paragraph 1', text: 'GT-JAR-050 capacity 50 ml'});
  const bomb = Buffer.from(fixture); const centralOffset = bomb.readUInt32LE(bomb.length - 6); bomb.writeUInt32LE(100 * 1024 * 1024, centralOffset + 24);
  await expect(parseKnowledgeFile('bomb.docx', bomb)).rejects.toThrow('DOCUMENT_ARCHIVE_LIMIT');
  expect((await parseIsolated('jar.docx', fixture)).segments[0].text).toContain('50 ml');
});

it('parses UTF-8 text and CSV without losing source locations', async () => {
  expect(await parseKnowledgeFile('资料.md', Buffer.from('# 眼膜\n\nGT-EYE-001 保湿。'))).toMatchObject({segments: [{location: 'text', text: '# 眼膜\n\nGT-EYE-001 保湿。'}]});
  const csv = await parseKnowledgeFile('规格.csv', Buffer.from('SKU,Material\r\nGT-EYE-001,"Hydrogel, soft"\r\n'));
  expect(csv.segments[0]).toMatchObject({location: 'CSV rows 1-2'});
  expect(csv.segments[0].text).toContain('Material: Hydrogel, soft');
});

it('extracts digital PDF text and explicitly identifies scanned PDFs', async () => {
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText('GT-EYE-001 hydrogel eye patch', {font});
  const result = await parseKnowledgeFile('spec.pdf', Buffer.from(await pdf.save()));
  expect(result.segments[0]).toMatchObject({location: 'PDF page 1'});
  expect(result.segments[0].text).toContain('GT-EYE-001');
  const blank = await PDFDocument.create(); blank.addPage();
  await expect(parseKnowledgeFile('scan.pdf', Buffer.from(await blank.save()))).rejects.toThrow('OCR_REQUIRED');
});

it('extracts spreadsheet values without evaluating formulas or links', async () => {
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('规格');
  sheet.addRow(['SKU', 'Material']); sheet.addRow(['GT-EYE-001', 'Hydrogel']);
  const result = await parseKnowledgeFile('spec.xlsx', Buffer.from(await workbook.xlsx.writeBuffer()));
  expect(result.segments[0].location).toContain('规格');
  expect(result.segments[0].text).toContain('GT-EYE-001');
});

it('rejects unsupported, forged and oversized input and bounds each retrieval chunk', async () => {
  await expect(parseKnowledgeFile('run.exe', Buffer.from('bad'))).rejects.toThrow('UNSUPPORTED_DOCUMENT');
  await expect(parseKnowledgeFile('fake.pdf', Buffer.from('not PDF'))).rejects.toThrow('INVALID_DOCUMENT');
  await expect(parseKnowledgeFile('big.txt', Buffer.alloc(8 * 1024 * 1024 + 1))).rejects.toThrow('DOCUMENT_TOO_LARGE');
  const chunks = chunkSegments([{location: 'text', text: '水凝胶眼膜规格。'.repeat(500)}]);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.every(chunk => chunk.text.length <= 1400 && chunk.location === 'text')).toBe(true);
});
