import {parseKnowledgeFile} from './parser';

process.once('message', async (request: {fileName: string; base64: string}) => {
  try {
    const parsed = await parseKnowledgeFile(request.fileName, Buffer.from(request.base64, 'base64'));
    process.send?.({parsed}, () => process.exit(0));
  } catch (error) {
    const code = error instanceof Error && /^[A-Z_]{3,80}$/.test(error.message) ? error.message : 'DOCUMENT_PARSE_FAILED';
    process.send?.({error: code}, () => process.exit(0));
  }
});
