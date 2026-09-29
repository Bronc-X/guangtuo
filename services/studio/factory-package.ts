import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import type {StoredInquiry} from '../../src/lib/inquiry-admin-contracts';
import {customerDesignInfo} from '../../src/lib/customer-design';
import {allPackagingProducts} from '../../src/data/legacy-packaging-catalog';
import type {StudioGateway} from './gateway';

type File={name:string;bytes:Buffer};
// Uncompressed ZIP: small file count, UTF-8 names, deterministic offsets and CRC checks.
export function zipFiles(files:File[]) {
  let offset=0;const local:Buffer[]=[],central:Buffer[]=[];
  for(const file of files) {
    if(!/^[\w.-]+$/.test(file.name)||file.bytes.length>60_000_000)throw new Error('Invalid package file');
    const name=Buffer.from(file.name);let crc=0xffffffff;
    for(const byte of file.bytes){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    crc=(crc^0xffffffff)>>>0;
    const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(file.bytes.length,18);h.writeUInt32LE(file.bytes.length,22);h.writeUInt16LE(name.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);h.copy(c,6,4,30);c.writeUInt32LE(offset,42);
    local.push(h,name,file.bytes);central.push(c,name);offset+=h.length+name.length+file.bytes.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}
const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function factoryPackage(record:StoredInquiry,preview:Buffer|null,gateway:StudioGateway,publicDir:string,attachments:{id:string;name:string;bytes:Buffer}[] = []) {
  const design=record.input.design;if(!design)throw new Error('此询盘没有设计方案');
  const info=customerDesignInfo(design),files:File[]=[],missing:string[]=[];
  if(preview)files.push({name:'preview.png',bytes:preview});else missing.push('客户效果图未保存');
  let modelDescription='';
  if(design.kind==='generated'&&design.jobId&&gateway.configured){
    try{const asset=await gateway.asset('jobs',design.jobId);files.push({name:'customer-model.glb',bytes:asset.bytes});modelDescription='客户生成的展示模型';}catch{missing.push('生成模型暂时无法取得');}
  }else if(design.kind==='existing'){
    const product=allPackagingProducts.find(p=>p.sku===design.sku);
    if(product){try{const bytes=await readFile(path.join(publicDir,product.modelPath.split('?')[0]));files.push({name:'base-model.glb',bytes});modelDescription='产品基础模型；所选颜色、规格及 Logo 以效果图和规格表为准';}catch{missing.push('产品基础模型文件暂不可用');}}
    else missing.push('历史产品模型未找到');
  }else missing.push('客户生成模型尚未接入或未保存任务编号');
  if(!attachments.length)missing.push('尚未上传 Logo、印刷原稿、CAD 或打样确认附件');
  for(const file of attachments)files.push({name:`attachment-${file.id}${path.extname(file.name).toLowerCase()}`,bytes:file.bytes});
  // Deliberately omit personal contacts and the email/conversation history from factory exports.
  const needs={quantity:record.input.quantity,launchDate:record.input.launchDate,productGoal:record.input.productGoal,packagingPreference:record.input.packagingPreference,certificationConstraints:record.input.certificationConstraints,notes:record.input.notes};
  const snapshot={id:record.id,submittedAt:record.createdAt,design,name:info.name,specifications:info.specifications,needs,modelDescription,missing,attachments:attachments.map(f=>({name:f.name,file:`attachment-${f.id}${path.extname(f.name).toLowerCase()}`}))};
  files.push({name:'design.json',bytes:Buffer.from(JSON.stringify(snapshot,null,2))});
  const rows=info.specifications.map(s=>`<tr><th>${escape(s.label)}</th><td>${escape(s.value)}</td></tr>`).join('');
  const labels={quantity:'数量',launchDate:'期望交期',productGoal:'产品目标',packagingPreference:'包装要求',certificationConstraints:'认证要求',notes:'客户备注'};
  const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>工厂设计资料</title><style>body{max-width:960px;margin:40px auto;font:16px/1.7 sans-serif;color:#222}table{border-collapse:collapse;width:100%}th,td{padding:12px;border:1px solid #ddd;text-align:left}th{width:25%;background:#eef3f1}p{white-space:pre-wrap}img{max-width:100%;max-height:700px}li{margin:8px 0}@media print{body{margin:10mm}}</style><h1>${escape(info.name)} · 设计资料</h1><p>方案编号：${escape(record.id)}<br>提交时间：${escape(record.createdAt)}</p>${preview?'<img src="preview.png" alt="客户效果图">':''}<h2>规格</h2><table>${rows}<tr><th>开合状态</th><td>${design.assemblyState==='open'?'打开':'闭合'}</td></tr></table><h2>需求</h2>${Object.entries(needs).filter(([,v])=>v).map(([k,v])=>`<h3>${labels[k as keyof typeof labels]}</h3><p>${escape(v)}</p>`).join('')}<h2>模型</h2><p>${escape(modelDescription||'无可用模型')}</p>${info.href?`<p><a href="https://showkibiotech.com${escape(info.href)}">查看规格配置</a></p>`:''}<h2>生产附件</h2><ul>${attachments.map(f=>`<li><a href="attachment-${f.id}${escape(path.extname(f.name).toLowerCase())}">${escape(f.name)}</a></li>`).join('')}</ul><p>模型用于外观参考；生产尺寸、刀模及打样结果须由工厂确认。</p><h2>待补资料</h2><ul>${missing.map(v=>`<li>${escape(v)}</li>`).join('')}</ul></html>`;
  files.push({name:'design.html',bytes:Buffer.from(html)});
  const manifest={packageVersion:1,designId:record.id,createdAt:new Date().toISOString(),files:files.map(f=>({name:f.name,bytes:f.bytes.length,sha256:createHash('sha256').update(f.bytes).digest('hex')})),missing};
  files.push({name:'manifest.json',bytes:Buffer.from(JSON.stringify(manifest,null,2))});
  files.push({name:'README.txt',bytes:Buffer.from('工厂设计资料包\n解压后打开 design.html 查看效果图、规格和需求；design.json 为结构化数据，manifest.json 为文件校验清单。\n'+modelDescription+'\n待补资料：\n'+missing.join('\n'))});
  return zipFiles(files);
}
