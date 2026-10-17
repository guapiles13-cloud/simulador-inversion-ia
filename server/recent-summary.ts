import type {Bar} from './providers.ts';
const value=(price:string)=>{const [whole,fraction='']=price.split('.');return BigInt(whole)*10n**12n+BigInt(fraction.padEnd(12,'0'));};
function percent(from:string,to:string){const base=value(from),diff=value(to)-base;const abs=diff<0n?-diff:diff;const n=(abs*10000n+base/2n)/base;return (n===0n?'':diff<0n?'-':'+')+(n/100n).toString()+','+(n%100n).toString().padStart(2,'0')+' %';}
const usd=(price:string)=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'USD',maximumFractionDigits:4}).format(Number(price));
export function recentSummary(symbol:string,bars:Bar[],asOf?:string){
 const rows=bars.filter(b=>!asOf||b.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));const last=rows.at(-1);
 if(!last)return 'No hay cierres guardados para resumir este activo en la fecha elegida.';
 const parts=[symbol+' · datos hasta '+last.date+'.'];
 for(const n of [5,20]){const first=rows.at(-n-1);parts.push(first?'En '+n+' sesiones (del '+first.date+' al '+last.date+'), el cierre varió '+percent(first.close,last.close)+'.':'Faltan datos para calcular la variación de '+n+' sesiones.');}
 const window=rows.slice(-20);let low=window[0],high=window[0];for(const row of window){if(value(row.close)<value(low.close))low=row;if(value(row.close)>value(high.close))high=row;}
 parts.push('En los últimos '+window.length+' cierres, el menor fue '+usd(low.close)+' ('+low.date+') y el mayor '+usd(high.close)+' ('+high.date+'). El último cierre fue '+usd(last.close)+'.');
 if(rows.length>=2){const changes=rows.slice(-21);let largest={from:changes[0],to:changes[1]};for(let i=2;i<changes.length;i++){const diff=value(changes[i].close)-value(changes[i-1].close),prior=value(largest.to.close)-value(largest.from.close);if((diff<0n?-diff:diff)*value(largest.from.close)>(prior<0n?-prior:prior)*value(changes[i-1].close))largest={from:changes[i-1],to:changes[i]};}parts.push('La mayor variación entre cierres consecutivos en las últimas '+(changes.length-1)+' sesiones fue '+percent(largest.from.close,largest.to.close)+' el '+largest.to.date+'.');}
 parts.push('5 y 20 sesiones son aproximadamente una y cuatro semanas de bolsa. Son cambios de precio en dólares, sin dividendos ni costes: no equivalen a tu rentabilidad en euros ni predicen lo que ocurrirá.');
 return parts.join(' ');
}
