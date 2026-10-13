import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Bar} from './providers.ts';
export const SCALE=1000000000000n;
const BP=10000n;
const signedUnits=(value:string)=>value.startsWith('-')?-units(value.slice(1)):units(value);
export function units(value:string){if(typeof value!=='string'||!/^\d+(\.\d{1,12})?$/.test(value))throw new Error('Introduce un decimal positivo con un máximo de 12 cifras decimales.');const [w,f='']=value.split('.');return BigInt(w)*SCALE+BigInt(f.padEnd(12,'0'));}
export function decimal(value:bigint){const sign=value<0n?'-':'';const n=value<0n?-value:value;return sign+(n/SCALE).toString()+'.'+(n%SCALE).toString().padStart(12,'0');}
const ceil=(a:bigint,b:bigint)=>(a+b-1n)/b;
export type Dataset={dates:string[];assets:Record<string,{bars:Bar[];splits:string[];checkedThrough:string|null}>;fx:{date:string;usd:string}[]};
export type Order={id:string;symbol:string;side:'buy'|'sell';input:string;decidedAt:string;status:'pending'|'executed'|'cancelled'|'rejected';reason:string;execution?:{date:string;quantity:string;openUsd:string;effectiveUsd:string;fxDate:string;fxUsd:string;grossEur:string;feeEur:string;cashEur:string;basisEur:string}};
export type State={id:string;mode:'historical'|'daily';label:string;start:string;cursor:string;cash:string;positions:Record<string,{quantity:string;basis:string}>;orders:Order[];commissionBp:number;slippageBp:number;realized:string;equityHistory:{date:string;equity:string}[]};
export function fxBefore(data:Dataset,date:string){const fx=data.fx.filter(r=>r.date<date).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);if(!fx||units(fx.usd)<=0n||Date.parse(date)-Date.parse(fx.date)>7*86400000)throw new Error('Falta una referencia de divisa anterior y suficientemente reciente.');return fx;}
export function blockReason(data:Dataset,symbol:string,date:string){
  const asset=data.assets[symbol];if(!asset)return 'Activo no disponible.';
  if(!asset.checkedThrough||asset.checkedThrough<date)return 'No se han verificado los desdoblamientos para esta fecha.';
  if(asset.splits.some(d=>d>=data.dates[0]&&d<=date))return 'Desdoblamiento detectado en el periodo: activo bloqueado hasta implementar su tratamiento.';
  const rows=asset.bars.filter(b=>b.date<=date);
  for(let i=1;i<rows.length;i++){const open=units(rows[i].open),prev=units(rows[i-1].close);const gap=open>prev?open-prev:prev-open;if(gap*100n>prev*30n)return 'Variación apertura/cierre superior al 30 %: activo suspendido para revisión.';}
  return null;
}
export function calculateFill(side:'buy'|'sell',input:string,openUsd:string,fxUsd:string,commissionBp:number,slippageBp:number){
  const usd=units(openUsd),fx=units(fxUsd),feeBp=BigInt(commissionBp),slipBp=BigInt(slippageBp);if(usd<=0n||fx<=0n)throw new Error('Precio o divisa inválidos.');
  const budget=units(input);if(budget<=0n)throw new Error('El importe o cantidad debe ser mayor que cero.');
  const factor=side==='buy'?BP+slipBp:BP-slipBp;
  let quantity=side==='sell'?budget:budget*fx*BP*BP/(usd*factor*(BP+feeBp));
  const quote=(q:bigint)=>{const numerator=q*usd*factor;const denominator=fx*BP;const gross=side==='buy'?ceil(numerator,denominator):numerator/denominator;const fee=ceil(gross*feeBp,BP);return {gross,fee,cash:side==='buy'?gross+fee:gross-fee};};
  let fill=quote(quantity);
  if(side==='buy'&&fill.cash>budget){quantity=(budget-2n)*fx*BP*BP/(usd*factor*(BP+feeBp));fill=quote(quantity);}
  if(quantity<=0n||fill.cash<=0n||side==='buy'&&fill.cash>budget)throw new Error('La orden es demasiado pequeña para esta precisión.');
  return {quantity, ...fill,effectiveUsd:usd*factor/BP};
}
export function newState(mode:State['mode'],data:Dataset,label:string,commissionBp=10,slippageBp=10):State{
  if(data.dates.length<51)throw new Error('Se necesitan 51 sesiones comunes para iniciar el ejercicio.');
  if(!Number.isInteger(commissionBp)||!Number.isInteger(slippageBp)||commissionBp<0||commissionBp>500||slippageBp<0||slippageBp>500)throw new Error('Los costes deben estar entre 0 y 5 %, con dos decimales de precisión.');
  const cursor=mode==='historical'?data.dates[49]:data.dates.at(-1)!;fxBefore(data,cursor);
  return {id:randomUUID(),mode,label,start:cursor,cursor,cash:decimal(100n*SCALE),positions:{},orders:[],commissionBp,slippageBp,realized:decimal(0n),equityHistory:[{date:cursor,equity:decimal(100n*SCALE)}]};
}
function reservations(state:State){return {cash:state.orders.filter(o=>o.status==='pending'&&o.side==='buy').reduce((n,o)=>n+units(o.input),0n),shares:(symbol:string)=>state.orders.filter(o=>o.status==='pending'&&o.side==='sell'&&o.symbol===symbol).reduce((n,o)=>n+units(o.input),0n)};}
export function queueOrder(state:State,data:Dataset,input:{id:string;symbol:string;side:'buy'|'sell';amount:string}){
  if(typeof input.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(input.id)||!['buy','sell'].includes(input.side))throw new Error('Orden no válida.');
  const existing=state.orders.find(o=>o.id===input.id);if(existing){if(existing.symbol!==input.symbol||existing.side!==input.side||existing.input!==input.amount)throw new Error('Ese identificador ya pertenece a otra orden.');return existing;}
  const blocked=blockReason(data,input.symbol,state.cursor);if(blocked)throw new Error(blocked);
  const amount=units(input.amount);if(amount<=0n)throw new Error('El importe o cantidad debe ser mayor que cero.');
  const reserved=reservations(state);
  if(input.side==='buy'&&(amount<units('0.01')||amount>units(state.cash)-reserved.cash))throw new Error('Importe mínimo: 0,01 €. No puede superar el saldo disponible.');
  if(input.side==='sell'&&amount>units(state.positions[input.symbol]?.quantity||'0')-reserved.shares(input.symbol))throw new Error('No tienes esa cantidad de acciones disponible.');
  const order:Order={id:input.id,symbol:input.symbol,side:input.side,input:input.amount,decidedAt:state.cursor,status:'pending',reason:'Orden manual. Pendiente de la apertura de la siguiente sesión.'};state.orders.push(order);return order;
}
export function valueState(state:State,data:Dataset){
  const fx=fxBefore(data,state.cursor);let invested=0n,basis=0n;const reserved=reservations(state);
  const positions=Object.entries(state.positions).map(([symbol,p])=>{
    const row=data.assets[symbol]?.bars.find(b=>b.date===state.cursor);if(!row)throw new Error('Falta un cierre para valorar la cartera.');
    const blocked=blockReason(data,symbol,state.cursor);if(blocked)throw new Error('Valoración suspendida: '+blocked);
    const value=units(p.quantity)*units(row.close)/units(fx.usd);invested+=value;basis+=units(p.basis);
    return {symbol,quantity:p.quantity,availableQuantity:decimal(units(p.quantity)-reserved.shares(symbol)),basis:p.basis,value:decimal(value),unrealized:decimal(value-units(p.basis)),closeUsd:row.close};
  });
  const equity=units(state.cash)+invested;
  return {positions,cash:state.cash,reservedCash:decimal(reserved.cash),availableCash:decimal(units(state.cash)-reserved.cash),invested:decimal(invested),equity:decimal(equity),profit:decimal(equity-100n*SCALE),realized:state.realized,unrealized:decimal(invested-basis),fxDate:fx.date,fxUsd:fx.usd};
}
export function advance(state:State,data:Dataset,date:string){
  const index=data.dates.indexOf(state.cursor);if(data.dates[index+1]!==date)throw new Error('Solo puedes avanzar a la siguiente sesión común.');
  const fx=fxBefore(data,date);
  for(const symbol of Object.keys(state.positions)){const blocked=blockReason(data,symbol,date);if(blocked)throw new Error('Avance suspendido: '+blocked);}
  for(const order of state.orders.filter(o=>o.status==='pending')){
    const blocked=blockReason(data,order.symbol,date);if(blocked){order.status='rejected';order.reason=blocked;continue;}
    const row=data.assets[order.symbol]?.bars.find(b=>b.date===date);if(!row)throw new Error('Falta el precio de apertura.');
    const fill=calculateFill(order.side,order.input,row.open,fx.usd,state.commissionBp,state.slippageBp);
    const previous=state.positions[order.symbol]||{quantity:'0',basis:'0'};let basis=0n;
    if(order.side==='buy'){
      if(fill.cash>units(state.cash))throw new Error('Saldo insuficiente al ejecutar.');state.cash=decimal(units(state.cash)-fill.cash);
      state.positions[order.symbol]={quantity:decimal(units(previous.quantity)+fill.quantity),basis:decimal(units(previous.basis)+fill.cash)};
    }else{
      const oldQuantity=units(previous.quantity);if(fill.quantity>oldQuantity)throw new Error('Cantidad insuficiente al ejecutar.');
      basis=fill.quantity===oldQuantity?units(previous.basis):units(previous.basis)*fill.quantity/oldQuantity;
      state.cash=decimal(units(state.cash)+fill.cash);state.realized=decimal(signedUnits(state.realized)+fill.cash-basis);
      const remaining=oldQuantity-fill.quantity;if(remaining===0n)delete state.positions[order.symbol];else state.positions[order.symbol]={quantity:decimal(remaining),basis:decimal(units(previous.basis)-basis)};
    }
    order.status='executed';order.reason='Ejecutada en apertura de la sesión siguiente con costes simulados.';
    order.execution={date,quantity:decimal(fill.quantity),openUsd:row.open,effectiveUsd:decimal(fill.effectiveUsd),fxDate:fx.date,fxUsd:fx.usd,grossEur:decimal(fill.gross),feeEur:decimal(fill.fee),cashEur:decimal(fill.cash),basisEur:decimal(basis)};
  }
  state.cursor=date;state.equityHistory.push({date,equity:valueState(state,data).equity});
}
export function walletView(state:State,data:Dataset){return {id:state.id,mode:state.mode,label:state.label,start:state.start,date:state.cursor,commissionBp:state.commissionBp,slippageBp:state.slippageBp,...valueState(state,data),orders:state.orders,equityHistory:state.equityHistory,nextDate:data.dates[data.dates.indexOf(state.cursor)+1]||null,blockedAssets:Object.keys(data.assets).map(symbol=>({symbol,reason:blockReason(data,symbol,state.cursor)}))};}
export function initializeWalletDb(db:DatabaseSync){db.exec('CREATE TABLE IF NOT EXISTS wallets (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, state TEXT NOT NULL, dataset TEXT NOT NULL)');}
export function createWallet(db:DatabaseSync,mode:State['mode'],data:Dataset,label:string,commissionBp=10,slippageBp=10){const state=newState(mode,data,label,commissionBp,slippageBp);db.prepare('INSERT INTO wallets VALUES (?,?,?,?)').run(state.id,new Date().toISOString(),JSON.stringify(state),JSON.stringify(data));return walletView(state,data);}
export function readWallet(db:DatabaseSync,id:string){const row=db.prepare('SELECT state,dataset FROM wallets WHERE id=?').get(id) as {state:string;dataset:string}|undefined;if(!row)throw new Error('Cartera no encontrada.');return {state:JSON.parse(row.state) as State,data:JSON.parse(row.dataset) as Dataset};}
export function mutateWallet(db:DatabaseSync,id:string,action:(state:State,data:Dataset)=>void){db.exec('BEGIN IMMEDIATE');try{const {state,data}=readWallet(db,id);action(state,data);const view=walletView(state,data);db.prepare('UPDATE wallets SET state=?,dataset=? WHERE id=?').run(JSON.stringify(state),JSON.stringify(data),id);db.exec('COMMIT');return view;}catch(e){db.exec('ROLLBACK');throw e;}}
