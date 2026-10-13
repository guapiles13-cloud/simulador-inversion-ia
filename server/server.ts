import {createServer} from 'node:http';
import {mkdirSync, readFileSync, existsSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {symbols, parseDaily, parseFx, getJson,parseSplits} from './providers.ts';
import {alignSeries,analyze,requestComment,chartSeries} from './analysis.ts';
import {initializeWalletDb,createWallet,readWallet,walletView,mutateWallet,queueOrder,advance} from './wallet.ts';
import type {Dataset,State} from './wallet.ts';

const root = resolve(import.meta.dirname, '..');
mkdirSync(resolve(root,'data'),{recursive:true});
const db = new DatabaseSync(resolve(root,'data','simulador.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS checks (name TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS snapshots (symbol TEXT PRIMARY KEY, source TEXT NOT NULL, fetched_at TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts (symbol TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(symbol,day));`);
db.exec('CREATE TABLE IF NOT EXISTS explanations (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
db.exec('CREATE TABLE IF NOT EXISTS splits (symbol TEXT PRIMARY KEY, checked_day TEXT NOT NULL, dates TEXT NOT NULL)');
initializeWalletDb(db);
function walletDataset():Dataset{
  const data=market();const fxRow=db.prepare("SELECT payload FROM snapshots WHERE symbol='BCE'").get() as {payload:string}|undefined;
  if(data.count<51||!fxRow)throw new Error('Faltan precios o divisas para crear la cartera.');
  return {dates:data.assets[0].bars.map((b:{date:string})=>b.date),fx:JSON.parse(fxRow.payload).rates,assets:Object.fromEntries(data.assets.map(a=>{const split=db.prepare('SELECT checked_day,dates FROM splits WHERE symbol=?').get(a.symbol) as {checked_day:string;dates:string}|undefined;return [a.symbol,{bars:a.bars,splits:split?JSON.parse(split.dates):[],checkedThrough:split?.checked_day||null}];}))};
}
function mergeDataset(old:Dataset,fresh:Dataset){
  for(const symbol of symbols){const a=old.assets[symbol],b=fresh.assets[symbol];for(const row of b.bars){const prior=a.bars.find(p=>p.date===row.date);if(prior&&JSON.stringify(prior)!==JSON.stringify(row))throw new Error('El proveedor corrigió precios guardados. Se suspende la actualización para revisión.');}
    a.bars=[...a.bars,...b.bars.filter(r=>!a.bars.some(p=>p.date===r.date))].sort((x,y)=>x.date.localeCompare(y.date));a.splits=[...new Set([...a.splits,...b.splits])].sort();a.checkedThrough=b.checkedThrough;}
  old.dates=old.assets[symbols[0]].bars.map(b=>b.date).filter(d=>symbols.every(s=>old.assets[s].bars.some(b=>b.date===d))).sort();
  for(const rate of fresh.fx){const prior=old.fx.find(r=>r.date===rate.date);if(prior&&prior.usd!==rate.usd)throw new Error('El BCE corrigió una referencia guardada. Se suspende la actualización para revisión.');if(!prior)old.fx.push(rate);}
  old.fx.sort((a,b)=>a.date.localeCompare(b.date));
}
type Check = {ok: boolean; message: string; checkedAt?: string; count?: number; lastDate?: string};
function save(name: string, value: Check) {db.prepare('INSERT OR REPLACE INTO checks VALUES (?,?)').run(name,JSON.stringify({...value,checkedAt:new Date().toISOString()}));}
function checks(): Record<string,Check> {return Object.fromEntries((db.prepare('SELECT * FROM checks').all() as {name:string;value:string}[]).map(r=>[r.name,JSON.parse(r.value)]));}
const key = process.env.ALPHA_VANTAGE_API_KEY?.trim();
let busy = false;
let explaining = false;
function market(asOf?:string){
  const stored=(db.prepare("SELECT symbol,payload FROM snapshots WHERE symbol<>'BCE'").all() as {symbol:string;payload:string}[]).map(r=>({symbol:r.symbol,bars:JSON.parse(r.payload).bars}));
  const aligned=alignSeries(stored,symbols,asOf);
  return {asOf:aligned.asOf,count:aligned.count,ready:aligned.ready,assets:aligned.series.map(s=>({symbol:s.symbol,originalLastDate:stored.find(r=>r.symbol===s.symbol)?.bars.filter((b:{date:string})=>!asOf||b.date<=asOf).at(-1)?.date||null,excludedCount:aligned.excluded.find(r=>r.symbol===s.symbol)!.dates.filter(d=>!asOf||d<=asOf).length,analysis:analyze(s.symbol,s.bars),bars:s.bars,chart:chartSeries(s.bars)}))};
}
const day = ()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Madrid'});
async function diagnose() {
  if (busy) return;
  busy=true;
  try {
    if (!key || key === 'demo') save('alpha',{ok:false,message:'Configura tu propia clave en .env y reinicia la aplicación. No uses la clave demo.'});
    else {
      save('alpha',{ok:true,message:'Clave configurada en el servidor; comprobando cobertura.'});
      for (const symbol of symbols) {
        if (db.prepare('SELECT 1 FROM attempts WHERE symbol=? AND day=?').get(symbol,day())) continue;
        db.prepare('INSERT INTO attempts VALUES (?,?)').run(symbol,day());
        try {
          const data = await getJson(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${encodeURIComponent(key)}`);
          const bars=parseDaily(data);
          db.prepare('INSERT OR REPLACE INTO snapshots VALUES (?,?,?,?)').run(symbol,'Alpha Vantage',new Date().toISOString(),JSON.stringify({raw:data,bars}));
          save(symbol,{ok:true,message:`${bars.length} sesiones verificadas`,count:bars.length,lastDate:bars.at(-1)!.date});
        } catch {save(symbol,{ok:false,message:'No se pudo validar la serie. Revisa acceso gratuito, clave, cuota o conexión. Se conservan los datos anteriores.'});}
      }
    }
    if (!db.prepare('SELECT 1 FROM attempts WHERE symbol=? AND day=?').get('BCE',day())) {
      db.prepare('INSERT INTO attempts VALUES (?,?)').run('BCE',day());
      try {
        const r=await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml',{signal:AbortSignal.timeout(20000)});
        if(!r.ok) throw new Error('BCE');
        const xml=await r.text(); const rates=parseFx(xml);
        db.prepare('INSERT OR REPLACE INTO snapshots VALUES (?,?,?,?)').run('BCE','Banco Central Europeo',new Date().toISOString(),JSON.stringify({rates}));
        save('BCE',{ok:true,message:'Referencias EUR/USD recibidas',count:rates.length,lastDate:rates.at(-1)!.date});
      } catch {save('BCE',{ok:false,message:'No se pudo comprobar el BCE. Se conservan las referencias anteriores.'});}
    }
    if(key&&key!=='demo')for(const symbol of symbols){
      const name='SPLITS:'+symbol;if(db.prepare('SELECT 1 FROM attempts WHERE symbol=? AND day=?').get(name,day()))continue;
      db.prepare('INSERT INTO attempts VALUES (?,?)').run(name,day());
      try{const raw=await getJson(`https://www.alphavantage.co/query?function=SPLITS&symbol=${symbol}&apikey=${encodeURIComponent(key)}`);const dates=parseSplits(raw,symbol);db.prepare('INSERT OR REPLACE INTO splits VALUES (?,?,?)').run(symbol,day(),JSON.stringify(dates));save(name,{ok:true,message:'Desdoblamientos verificados.'});}catch{save(name,{ok:false,message:'Desdoblamientos no verificados: operaciones bloqueadas hasta obtener estos datos.'});}
      await new Promise(r=>setTimeout(r,1200));
    }
    try {
      const tags=await getJson('http://127.0.0.1:11434/api/tags');
      const installed=tags.models?.map((m:{name:string})=>m.name)??[];
      const preferred=process.env.OLLAMA_MODEL || 'llama3.2:3b';
      const candidates=[...new Set([preferred,'llama3.2:1b'])].filter(m=>installed.includes(m));
      if (!candidates.length) throw new Error('No hay modelos');
      let passed=false;
      for(const model of candidates) {
        try {
          const start=Date.now();
          const analysis=market().assets[0].analysis;
          const comment=await requestComment(analysis,model);
          if(Date.now()-start>45000)throw new Error('Rendimiento');
          save('ollama',{ok:true,message:`${model}: respuesta estructurada validada en ${comment.seconds} s. Los conceptos y las cifras los determina la aplicación; no se publica texto libre del modelo.`});passed=true;break;
        } catch { /* Try the explicitly planned smaller local model. */ }
      }
      if(!passed) throw new Error('Modelos sin respuesta');
    } catch {save('ollama',{ok:false,message:'No se validó una respuesta de IA local: comprueba servicio, modelo, rendimiento o concordancia con los datos. La explicación calculada sigue disponible.'});}
  } finally {busy=false;}
}
const port=Number(process.env.PORT || 4317);
if(!Number.isInteger(port)||port<1024||port>65535) throw new Error('Puerto inválido');
const origin=`http://127.0.0.1:${port}`;
createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  const url=new URL(req.url || '/',origin);
  const json=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try {
    if(req.headers.host!==`127.0.0.1:${port}`) return json(403,{error:'Abre la dirección local indicada.'});
    if(req.method==='POST'&&req.headers.origin!==origin) return json(403,{error:'Origen no permitido.'});
    if(url.pathname==='/api/status'&&req.method==='GET') {
      const results=checks();
      return json(200,{busy,keyConfigured:!!key&&key!=='demo',checks:results,ready:[...symbols,'BCE','ollama'].every(s=>results[s]?.ok)&&market().ready,stage:'viabilidad',symbols});
    }
    if(url.pathname==='/api/wallets'&&req.method==='GET'){
      const rows=db.prepare('SELECT id,state FROM wallets ORDER BY created_at DESC,rowid DESC').all() as {id:string;state:string}[];
      return json(200,{runs:rows.map(r=>{const s=JSON.parse(r.state) as State;return {id:s.id,label:s.label,mode:s.mode,date:s.cursor};})});
    }
    if(url.pathname==='/api/wallet'&&req.method==='GET'){
      try{const {state,data}=readWallet(db,url.searchParams.get('id')||'');return json(200,walletView(state,data));}catch(e){return json(400,{error:(e as Error).message});}
    }
    if(url.pathname==='/api/wallet/export'&&req.method==='GET'){
      try{const {state}=readWallet(db,url.searchParams.get('id')||'');const rows=[['id','activo','tipo','decision','estado','ejecucion','cantidad','apertura_usd','precio_simulado_usd','fecha_fx','usd_por_eur','bruto_eur','comision_eur','cargo_o_abono_eur','motivo'],...state.orders.map(o=>[o.id,o.symbol,o.side,o.decidedAt,o.status,o.execution?.date||'',o.execution?.quantity||'',o.execution?.openUsd||'',o.execution?.effectiveUsd||'',o.execution?.fxDate||'',o.execution?.fxUsd||'',o.execution?.grossEur||'',o.execution?.feeEur||'',o.execution?.cashEur||'',o.reason])];const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+(/^[=+@-]/.test(v)?"'":'')+v.replaceAll('"','""')+'"').join(';')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="operaciones-virtuales.csv"'});return res.end(csv);}catch(e){return json(400,{error:(e as Error).message});}
    }
    if(req.method==='POST'&&(url.pathname==='/api/wallets'||url.pathname.startsWith('/api/wallet/'))){
      let text='';for await(const chunk of req){text+=chunk.toString();if(text.length>4096)return json(413,{error:'Solicitud demasiado grande.'});}
      try{
        const input=JSON.parse(text);if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Solicitud inválida.');
        if(url.pathname==='/api/wallets'){
          if(!['historical','daily'].includes(input.mode)||typeof input.label!=='string'||input.label.trim().length<1||input.label.length>80)throw new Error('Modalidad o nombre no válidos.');
          return json(201,createWallet(db,input.mode,walletDataset(),input.label.trim(),input.commissionBp??10,input.slippageBp??10));
        }
        if(typeof input.id!=='string')throw new Error('Falta la cartera.');
        const result=mutateWallet(db,input.id,(state,data)=>{
          if(input.date!==state.cursor)throw new Error('La sesión de la cartera ha cambiado. Actualiza antes de continuar.');
          if(url.pathname==='/api/wallet/order')queueOrder(state,data,{id:input.orderId,symbol:input.symbol,side:input.side,amount:input.amount});
          else if(url.pathname==='/api/wallet/cancel'){const order=state.orders.find(o=>o.id===input.orderId);if(!order||order.status!=='pending')throw new Error('Solo se pueden cancelar órdenes pendientes.');order.status='cancelled';order.reason='Cancelada manualmente; reserva liberada.';}
          else if(url.pathname==='/api/wallet/advance'){if(state.mode!=='historical')throw new Error('El seguimiento diario solo avanza con datos nuevos.');const next=data.dates[data.dates.indexOf(state.cursor)+1];if(!next)throw new Error('Has llegado al final del histórico guardado.');advance(state,data,next);}
          else if(url.pathname==='/api/wallet/sync'){if(state.mode!=='daily')throw new Error('La cartera histórica conserva su conjunto de datos.');mergeDataset(data,walletDataset());let next=data.dates[data.dates.indexOf(state.cursor)+1];while(next){advance(state,data,next);next=data.dates[data.dates.indexOf(state.cursor)+1];}}
          else throw new Error('Acción no disponible.');
        });return json(200,result);
      }catch(e){return json(400,{error:(e as Error).message});}
    }
    if(url.pathname==='/api/sessions'&&req.method==='GET'){
      const data=market();return json(200,{dates:data.assets[0]?.bars.map((b:{date:string})=>b.date)||[],asOf:data.asOf,count:data.count});
    }
    if(url.pathname==='/api/market'&&req.method==='GET'){
      const asOf=url.searchParams.get('asOf')||undefined;
      if(asOf&&!/^\d{4}-\d{2}-\d{2}$/.test(asOf))return json(400,{error:'Fecha no válida.'});
      return json(200,market(asOf));
    }
    if(url.pathname==='/api/explain'&&req.method==='POST'){
      if(explaining||busy)return json(409,{error:'Espera a que termine la comprobación actual.'});
      let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>2048)return json(413,{error:'Solicitud demasiado grande.'});}
      let input:{symbol?:string;asOf?:string};try{input=JSON.parse(body);}catch{return json(400,{error:'Solicitud no válida.'});}
      if(!input||!symbols.includes(input.symbol||'')||(input.asOf&&!/^\d{4}-\d{2}-\d{2}$/.test(input.asOf)))return json(400,{error:'Activo o fecha no válidos.'});
      const analysis=market(input.asOf).assets.find(a=>a.symbol===input.symbol)!.analysis;
      const model=process.env.OLLAMA_MODEL||'llama3.2:3b';
      const cacheId=JSON.stringify({analysis,model});
      const cached=db.prepare('SELECT value FROM explanations WHERE id=?').get(cacheId) as {value:string}|undefined;
      if(cached)return json(200,JSON.parse(cached.value));
      explaining=true;
      try{
        const comment=await requestComment(analysis,model);
        const result={analysis,comment,notice:'La IA clasifica conceptos permitidos; el texto mostrado utiliza frases revisadas. No es una predicción ni una orden.'};
        db.prepare('INSERT OR REPLACE INTO explanations VALUES (?,?)').run(cacheId,JSON.stringify(result));
        return json(200,result);
      }catch{return json(200,{analysis,comment:{status:'no_disponible',text:'Explicación de IA no disponible o rechazada por no concordar con los datos.'},notice:'Se conserva la explicación calculada; ninguna operación se ejecuta.'});}
      finally{explaining=false;}
    }
    if(url.pathname==='/api/check'&&req.method==='POST') {void diagnose().catch(()=>save('general',{ok:false,message:'Error en diagnóstico.'}));return json(202,{started:true});}
    if(url.pathname.startsWith('/api/')) return json(404,{error:'Función todavía no implementada.'});
    if(req.method!=='GET') return json(405,{error:'Método no permitido.'});
    const dist=resolve(root,'dist');
    const target=resolve(dist,'.'+decodeURIComponent(url.pathname));
    if(!target.startsWith(dist+sep)&&target!==dist) return json(403,{error:'Ruta no permitida.'});
    const file=existsSync(target)&&extname(target)?target:resolve(dist,'index.html');
    if(!existsSync(file)) return json(503,{error:'Ejecuta npm run build primero.'});
    const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
  } catch {json(500,{error:'Error local. No se han expuesto credenciales.'});}
}).listen(port,'127.0.0.1',()=>{
  console.log(`Simulador de inversión IA: ${origin}`);
  void diagnose().catch(()=>save('general',{ok:false,message:'Error en diagnóstico.'}));
});
setInterval(()=>{void diagnose().catch(()=>save('general',{ok:false,message:'Error en diagnóstico.'}));},60*60*1000).unref();
