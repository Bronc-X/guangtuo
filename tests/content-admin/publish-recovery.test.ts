import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {expect,it} from 'vitest';
import {openContentAdminDatabase} from '../../services/content-admin/database';
import {markInterruptedPublishes} from '../../services/content-admin/publisher';

it('clears interrupted publishing states after a restart while preserving live releases and drafts', () => {
  const directory=mkdtempSync(path.join(tmpdir(),'showki-publish-recovery-'));
  const db=openContentAdminDatabase(directory);
  try {
    const before=db.prepare("SELECT draft_json FROM managed_content_records WHERE record_key='pages:about'").get();
    const now=new Date().toISOString();
    db.prepare('INSERT INTO releases VALUES (?,?,?,?,?,?,?,?)').run('old-live','home','home','首页','live',null,now,now);
    db.prepare('INSERT INTO releases VALUES (?,?,?,?,?,?,?,?)').run('interrupted-home','home','home','首页','building',null,now,now);
    db.prepare('INSERT INTO managed_content_releases VALUES (?,?,?,?,?,?,?,?)').run('interrupted-about','pages:about','pages','关于我们','building',null,now,now);
    db.close();
    const reopened=openContentAdminDatabase(directory);
    try {
      markInterruptedPublishes(reopened);
      markInterruptedPublishes(reopened);
      expect(reopened.prepare("SELECT status FROM releases WHERE id='old-live'").get()).toMatchObject({status:'live'});
      expect(reopened.prepare("SELECT status,message FROM releases WHERE id='interrupted-home'").get()).toMatchObject({status:'failed',message:expect.stringContaining('草稿已保留')});
      expect(reopened.prepare("SELECT status FROM managed_content_releases WHERE id='interrupted-about'").get()).toMatchObject({status:'failed'});
      expect(reopened.prepare("SELECT draft_json FROM managed_content_records WHERE record_key='pages:about'").get()).toEqual(before);
    } finally {reopened.close();}
  } finally {if(db.isOpen)db.close();rmSync(directory,{recursive:true,force:true});}
});
