import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {randomUUID} from 'node:crypto';

// Export only main to a separate repository. The original repository is untouched.
const root=resolve(import.meta.dirname,'..');
const target=resolve(root,'work','github-'+randomUUID());
mkdirSync(target,{recursive:true});
const git=(cwd,args,input,env={})=>execFileSync('git',args,{cwd,input,env:{...process.env,...env},maxBuffer:32*1024*1024});
git(target,['init','--initial-branch=main']);
const raw=readFileSync(resolve(root,'.env'),'utf8');
const key=raw.match(/^ALPHA_VANTAGE_API_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
const commits=git(root,['rev-list','--reverse','--topo-order','main']).toString().trim().split('\n');
const mapping=new Map(),blobs=new Map(),excluded=new Set();
const allowed=path=>!/^([.]git|data|work|dist|node_modules|tmp|outputs)\//.test(path)&&path!=='.env'&&
 !['docs/DOCUMENTACION_TECNICA.md','docs/HISTORIAL_PROMPTS.md','docs/ENTREGA_CURSO.md'].includes(path)&&
 (['.md','.json','.ts','.tsx','.css','.cmd','.ps1','.html','.mjs'].includes(extname(path))||['Dockerfile','.gitignore','.dockerignore','.env.example'].includes(path));
for(const commit of commits){
 git(target,['read-tree','--empty']);
 const entries=git(root,['ls-tree','-r','-z',commit]).toString().split('\0').filter(Boolean);
 const records=[];
 for(const entry of entries){
  const tab=entry.indexOf('\t');const path=entry.slice(tab+1);const [mode,type,sha]=entry.slice(0,tab).split(' ');
  if(type!=='blob'||!allowed(path)){excluded.add(path);continue;}
  let outputSha=blobs.get(sha);
  if(!outputSha){
   const bytes=git(root,['cat-file','blob',sha]);
   if(key&&key.length>4&&bytes.includes(Buffer.from(key)))throw Error('Se encontró la clave configurada en '+path);
   if(/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/.test(bytes.toString()))throw Error('Se encontró material de clave privada en '+path);
   outputSha=git(target,['hash-object','-w','--stdin'],bytes).toString().trim();blobs.set(sha,outputSha);
  }
  records.push(`${mode} ${outputSha}\t${path}\0`);
 }
 git(target,['update-index','-z','--index-info'],Buffer.from(records.join('')));
 const tree=git(target,['write-tree']).toString().trim();
 const metadata=git(root,['show','-s','--format=%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%P',commit]).toString().trimEnd().split('\0');
 const [an,ae,ad,cn,ce,cd,parents]=metadata;
 const args=['commit-tree',tree];
 for(const parent of parents.split(' ').filter(Boolean)){if(!mapping.has(parent))throw Error('Falta un padre del historial');args.push('-p',mapping.get(parent));}
 const message=git(root,['show','-s','--format=%B',commit]);
 const sha=git(target,args,message,{GIT_AUTHOR_NAME:an,GIT_AUTHOR_EMAIL:ae,GIT_AUTHOR_DATE:ad,GIT_COMMITTER_NAME:cn,GIT_COMMITTER_EMAIL:ce,GIT_COMMITTER_DATE:cd}).toString().trim();
 mapping.set(commit,sha);
}
git(target,['update-ref','refs/heads/main',mapping.get(commits.at(-1))]);
git(target,['reset','--hard','main']);
git(target,['fsck','--no-reflogs']);
const paths=git(target,['ls-files','-z']).toString().split('\0').filter(Boolean);
if(paths.some(path=>!allowed(path)))throw Error('El árbol final contiene archivos no permitidos.');
console.log(JSON.stringify({repository:target,commits:commits.length,files:paths.length,excluded:[...excluded].sort(),originalUnchanged:true}));
