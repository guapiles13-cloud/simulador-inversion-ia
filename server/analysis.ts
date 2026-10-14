import type {Bar} from './providers.ts';
import {ollamaBaseUrl} from './runtime.ts';
export type Series = {symbol:string;bars:Bar[]};
export function alignSeries(series:Series[],required:string[],asOf?:string) {
  if(asOf&&!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('Fecha no válida.');
  const lists=required.map(symbol=>series.find(s=>s.symbol===symbol)?.bars||[]);
  const dates=lists[0]?.map(b=>b.date).filter(d=>lists.every(list=>list.some(b=>b.date===d)))||[];
  const common=[...new Set(dates)].sort().filter(d=>!asOf||d<=asOf);
  const selected=new Set(common);
  return {asOf:common.at(-1)||null,count:common.length,ready:common.length>=50,
    series:required.map((symbol,i)=>({symbol,bars:lists[i].filter(b=>selected.has(b.date)).sort((a,b)=>a.date.localeCompare(b.date))})),
    excluded:required.map((symbol,i)=>({symbol,dates:lists[i].filter(b=>!selected.has(b.date)).map(b=>b.date)}))};
}
export type Signal='COMPRA'|'VENTA'|'MANTENER'|'SIN_DATOS';
export function average(closes:string[]):string|null{
  if(!closes.length)return null;
  const digits=Math.max(...closes.map(v=>v.split('.')[1]?.length||0));const scale=10n**BigInt(digits);
  const sum=closes.reduce((total,v)=>{const [whole,fraction='']=v.split('.');return total+BigInt(whole)*scale+BigInt(fraction.padEnd(digits,'0')||'0');},0n);
  const result=sum*1000000n/(BigInt(closes.length)*scale);
  return `${result/1000000n}.${(result%1000000n).toString().padStart(6,'0')}`;
}
export function chartSeries(bars:Bar[],asOf?:string){
  const visible=bars.filter(b=>!asOf||b.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));
  return visible.map((b,i)=>({date:b.date,close:b.close,sma20:i>=19?average(visible.slice(i-19,i+1).map(r=>r.close)):null,sma50:i>=49?average(visible.slice(i-49,i+1).map(r=>r.close)):null}));
}
export type Analysis={symbol:string;date:string|null;count:number;sma20:string|null;sma50:string|null;signal:Signal;comparison:'mayor'|'menor'|'igual'|'insuficiente';explanation:string;version:string};
export function analyze(symbol:string,bars:Bar[],asOf?:string):Analysis {
  const available=bars.filter(b=>!asOf||b.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));
  const base={symbol,date:available.at(-1)?.date||null,count:available.length,version:'sma20-50-v1'};
  if(available.length<50)return {...base,sma20:null,sma50:null,signal:'SIN_DATOS',comparison:'insuficiente',explanation:'No hay 50 cierres disponibles. No se genera una señal.'};
  const last=available.slice(-50).map(b=>b.close);
  const digits=Math.max(...last.map(v=>v.split('.')[1]?.length||0));
  const scale=10n**BigInt(digits);
  const values=last.map(v=>{const [whole,fraction='']=v.split('.');return BigInt(whole)*scale+BigInt(fraction.padEnd(digits,'0')||'0');});
  const sum50=values.reduce((a,b)=>a+b,0n);const sum20=values.slice(-20).reduce((a,b)=>a+b,0n);
  const diff=sum20*50n-sum50*20n;
  const comparison=diff>0n?'mayor':diff<0n?'menor':'igual';
  const signal=diff>0n?'COMPRA':diff<0n?'VENTA':'MANTENER';
  const mean=(sum:bigint,n:bigint)=>{const v=(sum*1000000n)/(n*scale);return `${v/1000000n}.${(v%1000000n).toString().padStart(6,'0')}`;};
  const sma20=mean(sum20,20n),sma50=mean(sum50,50n);
  return {...base,sma20,sma50,signal,comparison,explanation:`La media de 20 sesiones es ${comparison==='igual'?'igual a':comparison+' que'} la de 50 sesiones. La regla produce ${signal}. Se comparan promedios de cierres, no precios de índices. Esta señal no garantiza ganancias.`};
}
export function validateComment(raw:string,analysis:Analysis){
  const value=JSON.parse(raw) as Record<string,unknown>;
  if(!value||typeof value!=='object'||Object.keys(value).sort().join(',')!=='comparison,concept,risk,signal'||value.signal!==analysis.signal||value.comparison!==analysis.comparison||value.concept!==(analysis.signal==='SIN_DATOS'?'datos_insuficientes':'promedio_cierres')||value.risk!=='sin_garantia')throw new Error('El comentario no coincide con los datos calculados.');
  return analysis.signal==='SIN_DATOS'?'Necesitamos más sesiones para comparar ambos promedios. Esperar datos evita interpretar una señal que no puede calcularse.':`Una media móvil es el promedio de los cierres de las últimas sesiones: 20 para SMA20 y 50 para SMA50. En esta fecha la relación es «${analysis.comparison}». La señal es educativa y no garantiza ganancias.`;
}
export async function requestComment(analysis:Analysis,model:string){
  const schema={type:'object',additionalProperties:false,properties:{signal:{type:'string',enum:['COMPRA','VENTA','MANTENER','SIN_DATOS']},comparison:{type:'string',enum:['mayor','menor','igual','insuficiente']},concept:{type:'string',enum:['promedio_cierres','datos_insuficientes']},risk:{type:'string',enum:['sin_garantia']}},required:['signal','comparison','concept','risk']};
  const expected={signal:analysis.signal,comparison:analysis.comparison,concept:analysis.signal==='SIN_DATOS'?'datos_insuficientes':'promedio_cierres',risk:'sin_garantia'};
  const start=Date.now();
  const response=await fetch(ollamaBaseUrl()+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,stream:false,format:schema,messages:[{role:'system',content:'Clasifica los datos de una explicación educativa. SMA20 es el promedio de 20 cierres y SMA50 de 50 cierres. No son índices. Usa solo las conclusiones calculadas recibidas. Devuelve únicamente JSON conforme al esquema: '+JSON.stringify(schema)},{role:'user',content:JSON.stringify({analysis,expected})}],options:{temperature:0,num_predict:140}})});
  if(!response.ok)throw new Error('Ollama no responde.');
  const result=await response.json();
  const text=validateComment(result.message?.content,analysis);
  return {text,seconds:Number(((Date.now()-start)/1000).toFixed(1)),model,status:'validado' as const};
}
