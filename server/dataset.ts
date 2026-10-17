import type {Dataset} from './wallet.ts';
import {symbols} from './providers.ts';
export function mergeDataset(old:Dataset,fresh:Dataset){
  for(const symbol of symbols){const a=old.assets[symbol],b=fresh.assets[symbol];for(const row of b.bars){const prior=a.bars.find(p=>p.date===row.date);if(prior&&JSON.stringify(prior)!==JSON.stringify(row))throw new Error('El proveedor corrigió precios guardados. Se suspende la actualización para revisión.');}
    a.bars=[...a.bars,...b.bars.filter(r=>!a.bars.some(p=>p.date===r.date))].sort((x,y)=>x.date.localeCompare(y.date));a.splits=[...new Set([...a.splits,...b.splits])].sort();a.checkedThrough=[a.checkedThrough,b.checkedThrough].filter((v):v is string=>!!v).sort().at(-1)||null;}
  const last=old.dates.at(-1)!;
  const extra=fresh.dates.filter(d=>d>last&&symbols.every(s=>old.assets[s].bars.some(b=>b.date===d)));
  old.dates=[...old.dates,...extra].sort();
  for(const rate of fresh.fx){const prior=old.fx.find(r=>r.date===rate.date);if(prior&&prior.usd!==rate.usd)throw new Error('El BCE corrigió una referencia guardada. Se suspende la actualización para revisión.');if(!prior)old.fx.push(rate);}
  old.fx.sort((a,b)=>a.date.localeCompare(b.date));
}
