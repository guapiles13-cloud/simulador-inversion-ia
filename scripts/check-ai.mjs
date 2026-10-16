import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {alignSeries,analyze,requestComment} from '../server/analysis.ts';
import {ollamaBaseUrl} from '../server/runtime.ts';
import {symbols} from '../server/providers.ts';

// Read cached real observations; never refresh providers or alter personal exercises.
const root=resolve(import.meta.dirname,'..');
const model=process.argv[2]||'llama3.2:1b';
if(!['llama3.2:1b','llama3.2:3b'].includes(model))throw Error('Modelo local de prueba no permitido.');
const db=new DatabaseSync(resolve(root,process.env.DATA_DIR||'data','simulador.sqlite'),{readOnly:true});
let aligned;
try{
  const series=db.prepare("SELECT symbol,payload FROM snapshots WHERE symbol<>'BCE'").all().map(r=>({symbol:r.symbol,bars:JSON.parse(r.payload).bars}));
  aligned=alignSeries(series,symbols);
}finally{db.close();}
if(!aligned.ready)throw Error('Faltan 50 sesiones reales comunes; no se inventan precios para la prueba.');
const cases=aligned.series.map(s=>analyze(s.symbol,s.bars));
cases.push(analyze(aligned.series[0].symbol,aligned.series[0].bars.slice(0,49)));
const base=ollamaBaseUrl();
const tags=await fetch(base+'/api/tags').then(r=>r.json());
if(!tags.models?.some(m=>m.name===model))throw Error('Descarga antes el modelo local seleccionado.');
const samples=[];
const rows=[];
const sample=async()=>{
  const state=await fetch(base+'/api/ps',{signal:AbortSignal.timeout(2000)}).then(r=>r.json());
  for(const loaded of state.models||[])if(loaded.name===model)samples.push({bytes:loaded.size,vramBytes:loaded.size_vram,context:loaded.context_length});
};
for(const analysis of cases){
  let pending=Promise.resolve();
  const timer=setInterval(()=>{pending=pending.then(sample).catch(()=>{});},250);
  try{
    const result=await requestComment(analysis,model);
    rows.push({symbol:analysis.symbol,signal:analysis.signal,seconds:result.seconds,status:result.status});
    console.log(JSON.stringify(rows.at(-1)));
  }catch{
    rows.push({symbol:analysis.symbol,signal:analysis.signal,status:'rechazado_o_no_disponible'});
    console.log(JSON.stringify(rows.at(-1)));
  }finally{clearInterval(timer);await pending;}
}
const remaining=await fetch(base+'/api/ps').then(r=>r.json());
const result={model,checkedAt:new Date().toISOString(),asOf:aligned.asOf,commonSessions:aligned.count,
  passed:rows.filter(r=>r.status==='validado').length,total:rows.length,rows,
  maxReportedModelBytes:samples.length?Math.max(...samples.map(s=>s.bytes)):null,
  maxReportedVramBytes:samples.length?Math.max(...samples.map(s=>s.vramBytes)):null,
  sampledContexts:[...new Set(samples.map(s=>s.context))],
  unloadedAfterResponse:!remaining.models?.some(m=>m.name===model),
  limits:'Medición local de asignación del modelo comunicada por Ollama; no es la RAM total del servidor ni una prueba de VPS. Datos reales guardados, sin actualizar proveedores.'};
mkdirSync(resolve(root,'work'),{recursive:true});
writeFileSync(resolve(root,'work',`ai-${model.endsWith(':1b')?'1b':'3b'}.json`),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
if(result.passed!==result.total||!result.unloadedAfterResponse)process.exitCode=1;
