import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID,randomBytes} from 'node:crypto';
const dataDir=resolve('work','hosting-smoke-'+randomUUID());mkdirSync(dataDir,{recursive:true});
const password=randomBytes(24).toString('hex');const origin='http://127.0.0.1:4329';
const child=spawn(process.execPath,['server/server.ts'],{env:{...process.env,APP_MODE:'hosted',PUBLIC_ORIGIN:origin,PORT:'4329',DATA_DIR:dataDir,REVIEW_PASSWORD:password,AUTO_CHECKS:'false'},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((ok,fail)=>{const timer=setTimeout(()=>fail(Error('Arranque no disponible')),10000);child.stdout.on('data',chunk=>{if(chunk.toString().includes('Simulador de inversión IA')){clearTimeout(timer);ok();}});child.once('error',fail);child.once('exit',()=>fail(Error('Proceso terminado antes de arrancar')));});
 const authorization='Basic '+Buffer.from('jurado:'+password).toString('base64');
 for(const [path,opts,expected] of [['/api/health',{},200],['/api/wallets',{},401],['/api/wallets',{headers:{authorization}},200],['/',{headers:{authorization}},200],['/api/check',{method:'POST',headers:{authorization,origin:'https://otro.example'}},403]]){
  const r=await fetch(origin+path,opts);if(r.status!==expected)throw Error(path+' estado inesperado '+r.status);
  if(path==='/api/wallets'&&r.status===200){const body=await r.json();if(body.runs.length||body.archivedRuns.length)throw Error('La prueba debe usar una base vacía');}
  console.log(path+' '+r.status+' correcto');
 }
}finally{child.kill();}
