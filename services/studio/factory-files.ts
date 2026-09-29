import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
import {ContentAiError} from '../marketing/content-ai';
import type {FactoryFile} from '../../src/lib/factory-file-contracts';

export function createFactoryFiles(db:DatabaseSync,dataDir:string) {
  db.exec('CREATE TABLE IF NOT EXISTS factory_files (id TEXT PRIMARY KEY,inquiry_id TEXT NOT NULL,name TEXT NOT NULL,size INTEGER NOT NULL,createdAt TEXT NOT NULL)');
  const directory=path.join(dataDir,'factory-files');
  const list=(inquiryId:string)=>db.prepare('SELECT id,name,size,createdAt FROM factory_files WHERE inquiry_id=? ORDER BY createdAt').all(inquiryId) as FactoryFile[];
  function get(inquiryId:string,id:string){const row=db.prepare('SELECT id,name,size,createdAt FROM factory_files WHERE inquiry_id=? AND id=?').get(inquiryId,id) as FactoryFile|undefined;if(!row)throw new ContentAiError(404,'附件不存在');return row;}
  return {list,
    async upload(inquiryId:string,name:string,bytes:Buffer){
      const ext=path.extname(name).toLowerCase();
      if(!['.pdf','.png','.jpg','.jpeg','.webp','.ai','.psd','.svg','.dxf','.dwg','.step','.stp','.stl','.glb','.zip','.xlsx','.docx','.txt'].includes(ext))throw new ContentAiError(422,'不支持此附件格式');
      if(!name||name.length>180||/[\\/\x00-\x1f]/.test(name))throw new ContentAiError(422,'文件名无效');
      if(!bytes.length||bytes.length>20_000_000)throw new ContentAiError(422,'单个附件须在 20 MB 以内');
      const prior=list(inquiryId);if(prior.length>=20||prior.reduce((sum,f)=>sum+f.size,0)+bytes.length>100_000_000)throw new ContentAiError(422,'每个方案最多 20 个附件，总计 100 MB');
      const file={id:randomUUID(),name,size:bytes.length,createdAt:new Date().toISOString()};
      await mkdir(directory,{recursive:true});await writeFile(path.join(directory,file.id),bytes,{flag:'wx'});
      try{db.prepare('INSERT INTO factory_files (id,inquiry_id,name,size,createdAt) VALUES (?,?,?,?,?)').run(file.id,inquiryId,file.name,file.size,file.createdAt);}catch(cause){await unlink(path.join(directory,file.id));throw cause;}
      return file;
    },
    async read(inquiryId:string,id:string){const file=get(inquiryId,id);return {...file,bytes:await readFile(path.join(directory,file.id))};},
    async remove(inquiryId:string,id:string){get(inquiryId,id);await unlink(path.join(directory,id));db.prepare('DELETE FROM factory_files WHERE id=? AND inquiry_id=?').run(id,inquiryId);}
  };
}
