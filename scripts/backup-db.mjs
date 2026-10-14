import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dataDir=resolve(root,process.env.DATA_DIR||'data');
const outputDir=resolve(dataDir,'backups');
mkdirSync(outputDir,{recursive:true});
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const output=resolve(outputDir,`simulador-${stamp}.sqlite`);
const source=new DatabaseSync(resolve(dataDir,'simulador.sqlite'),{readOnly:true});
try{source.prepare('VACUUM INTO ?').run(output);}finally{source.close();}
const copy=new DatabaseSync(output,{readOnly:true});
try{
 const result=copy.prepare('PRAGMA integrity_check').get();
 if(Object.values(result)[0]!=='ok')throw Error('La copia no superó la comprobación de integridad.');
 const counts=Object.fromEntries(['wallets','comparisons','wallet_archive','snapshots'].map(name=>[name,copy.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get().n]));
 console.log(JSON.stringify({backup:output,integrity:'ok',counts}));
}finally{copy.close();}
