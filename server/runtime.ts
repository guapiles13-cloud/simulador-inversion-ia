import {resolve} from 'node:path';
import {createHash,timingSafeEqual} from 'node:crypto';
import type {IncomingHttpHeaders} from 'node:http';

export function ollamaBaseUrl(env:NodeJS.ProcessEnv=process.env){
  const url=new URL(env.OLLAMA_BASE_URL||'http://127.0.0.1:11434');
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('OLLAMA_BASE_URL no válida.');
  return url.toString().replace(/\/$/,'');
}

export function runtime(env:NodeJS.ProcessEnv,root:string){
  const mode=env.APP_MODE||'local';
  if(!['local','hosted'].includes(mode))throw Error('APP_MODE debe ser local o hosted.');
  const hosted=mode==='hosted';
  const port=Number(env.PORT||4318);
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Puerto inválido');
  const raw=hosted?env.PUBLIC_ORIGIN:`http://127.0.0.1:${port}`;
  if(!raw)throw Error('El alojamiento requiere PUBLIC_ORIGIN.');
  const url=new URL(raw);
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!['http:','https:'].includes(url.protocol))throw Error('PUBLIC_ORIGIN debe contener solo el origen web.');
  if(hosted&&url.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(url.hostname))throw Error('El alojamiento público requiere HTTPS.');
  const user=env.REVIEW_USER||'jurado',password=env.REVIEW_PASSWORD||'';
  if(hosted&&(password.length<24||user.includes(':')))throw Error('El alojamiento requiere una contraseña de prueba de al menos 24 caracteres y un usuario sin dos puntos.');
  const authorization=hosted?'Basic '+Buffer.from(user+':'+password).toString('base64'):null;
  return {hosted,port,host:hosted?'0.0.0.0':'127.0.0.1',origin:url.origin,authority:url.host,
    dataDir:resolve(root,env.DATA_DIR||'data'),autoChecks:env.AUTO_CHECKS!=='false',authorization};
}

export function allowRequest(headers:IncomingHttpHeaders,method:string|undefined,path:string,config:ReturnType<typeof runtime>):200|401|403{
  if(headers.host!==config.authority)return 403;
  if(method==='GET'&&path==='/api/health')return 200;
  if(config.authorization){
    const digest=(s:string)=>createHash('sha256').update(s).digest();
    if(!timingSafeEqual(digest(headers.authorization||''),digest(config.authorization)))return 401;
  }
  if(method==='POST'&&headers.origin!==config.origin)return 403;
  return 200;
}
