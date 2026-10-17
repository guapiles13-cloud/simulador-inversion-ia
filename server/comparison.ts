import {mergeDataset} from './dataset.ts';
import type {DatabaseSync} from 'node:sqlite';
import {analyze} from './analysis.ts';
import {newState,queueOrder,advance,valueState,walletView,readWallet,units,decimal,blockReason} from './wallet.ts';
import type {State,Dataset} from './wallet.ts';
const stocks=['AAPL','AMZN','GOOGL','IBM','MSFT'];
type Decision={date:string;symbol:string;signal:string;sma20:string|null;sma50:string|null;action:string;reason:string};
export type Comparison={automatic:State;benchmark:State;decisions:Decision[];version:string};
export function initializeComparisonDb(db:DatabaseSync){db.exec('CREATE TABLE IF NOT EXISTS comparisons (wallet_id TEXT PRIMARY KEY, value TEXT NOT NULL)');}
function getComparison(db:DatabaseSync,id:string):Comparison|null{const row=db.prepare('SELECT value FROM comparisons WHERE wallet_id=?').get(id) as {value:string}|undefined;return row?JSON.parse(row.value):null;}
function save(db:DatabaseSync,id:string,c:Comparison){db.prepare('INSERT OR REPLACE INTO comparisons VALUES (?,?)').run(id,JSON.stringify(c));}
function plan(c:Comparison,data:Dataset){
 const s=c.automatic,date=s.cursor;
 if(c.decisions.some(d=>d.date===date))return;
 const total=units(valueState(s,data).equity);const budget=total/5n;
 const signals=stocks.map(symbol=>({symbol,a:analyze(symbol,data.assets[symbol]?.bars||[],date),blocked:blockReason(data,symbol,date)}));
 // Record sales first. Purchase budgets only use cash already available at this close.
 for(const {symbol,a,blocked} of signals)if(!blocked&&a.signal==='VENTA'&&s.positions[symbol]){
   const o=queueOrder(s,data,{id:`auto-${date}-${symbol}-sell`,symbol,side:'sell',amount:s.positions[symbol].quantity});o.reason=`Regla 20/50: vender porque SMA20 < SMA50 al cierre ${date}.`;
 }
 for(const {symbol,a,blocked} of signals){
   let action='mantener',reason='Sin orden: se conserva la posición o el efectivo.';
   if(blocked){action='bloqueado';reason=blocked;}
   else if(a.signal==='SIN_DATOS'){action='sin_datos';reason='No hay 50 cierres para calcular la regla.';}
   else if(a.signal==='VENTA'&&s.positions[symbol]){action='vender';reason='Salida completa propuesta: media 20 inferior a media 50.';}
   else if(a.signal==='COMPRA'&&!s.positions[symbol]){
     const available=units(valueState(s,data).availableCash);const amount=available<budget?available:budget;
     if(amount>=units('0.01')){const o=queueOrder(s,data,{id:`auto-${date}-${symbol}-buy`,symbol,side:'buy',amount:decimal(amount)});o.reason=`Regla 20/50: comprar porque SMA20 > SMA50 al cierre ${date}; presupuesto hasta el 20 % del valor al cierre.`;action='comprar';reason='Nueva entrada con presupuesto máximo del 20 % del valor al cierre, incluidos costes.';}
     else{action='sin_saldo';reason='No hay al menos 0,01 € de efectivo libre. No se anticipa dinero de ventas pendientes.';}
   }
   c.decisions.push({date,symbol,signal:a.signal,sma20:a.sma20,sma50:a.sma50,action,reason});
 }
 const benchmark=c.benchmark;
 if(!benchmark.orders.length&&!blockReason(data,'SPY',date)){
   const o=queueOrder(benchmark,data,{id:`reference-${date}-SPY-buy`,symbol:'SPY',side:'buy',amount:benchmark.cash});o.reason='Referencia por precio: comprar SPY en la apertura siguiente y mantener.';
 }
}
export function startComparison(manual:State,data:Dataset):Comparison{
 const make=(label:string)=>{const state=newState(manual.mode,data,label,manual.commissionBp,manual.slippageBp);state.start=manual.start;state.cursor=manual.start;state.equityHistory=[{date:manual.start,equity:decimal(units('100'))}];return state;};
 const c:Comparison={automatic:make('Automática · SMA20/50'),benchmark:make('Referencia · SPY'),decisions:[],version:'sma20-50-allocation20-v1'};
 plan(c,data);
 for(const date of data.dates.filter(d=>d>manual.start&&d<=manual.cursor)){advance(c.automatic,data,date);advance(c.benchmark,data,date);plan(c,data);}
 if(c.automatic.cursor!==manual.cursor)throw new Error('No se puede alinear la comparación con la cartera manual.');
 return c;
}
export function enableComparison(db:DatabaseSync,id:string,date:string){
 db.exec('BEGIN IMMEDIATE');try{const {state,data}=readWallet(db,id);if(state.cursor!==date)throw new Error('La sesión ha cambiado. Recarga la cartera.');if(!getComparison(db,id))save(db,id,startComparison(state,data));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 return comparisonView(db,id);
}
export function advanceCompared(db:DatabaseSync,manual:State,data:Dataset,date:string){
 const c=getComparison(db,manual.id);
 if(c&&(c.automatic.cursor!==manual.cursor||c.benchmark.cursor!==manual.cursor))throw new Error('Comparación desalineada: avance suspendido.');
 advance(manual,data,date);
 if(c){advance(c.automatic,data,date);advance(c.benchmark,data,date);plan(c,data);save(db,manual.id,c);}
}
export function comparisonView(db:DatabaseSync,id:string){
 const c=getComparison(db,id);if(!c)return null;
 const {state,data}=readWallet(db,id);
 if(c.automatic.cursor!==state.cursor||c.benchmark.cursor!==state.cursor)throw new Error('Las carteras no están alineadas.');
 return {version:c.version,automatic:walletView(c.automatic,data),benchmark:walletView(c.benchmark,data),decisions:c.decisions,notes:['Las decisiones usan solo cierres hasta la sesión actual; se ejecutan en la apertura siguiente.','El límite del 20 % se aplica al presupuesto de una nueva entrada al cierre, incluidos costes. No hay rebalanceo diario; el peso puede cambiar por precios o divisas.','Las compras usan efectivo libre al decidir. Los ingresos de ventas pendientes no se anticipan.','SPY es una referencia por precio: sin dividendos ni impuestos.']};
}

// Validate new metadata before the enclosing wallet transaction commits.
export function validateComparedData(db:DatabaseSync,manual:State,data:Dataset){
 valueState(manual,data);
 const c=getComparison(db,manual.id);
 if(c){valueState(c.automatic,data);valueState(c.benchmark,data);}
}

export function syncComparedData(db:DatabaseSync,state:State,data:Dataset,fresh:Dataset){
 mergeDataset(data,fresh);validateComparedData(db,state,data);
 let next=data.dates[data.dates.indexOf(state.cursor)+1];
 while(next){advanceCompared(db,state,data,next);next=data.dates[data.dates.indexOf(state.cursor)+1];}
}
