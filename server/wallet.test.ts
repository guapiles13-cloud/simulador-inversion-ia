import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {newState,queueOrder,advance,valueState,units,decimal,fxBefore,calculateFill,initializeWalletDb,createWallet,readWallet,mutateWallet} from './wallet.ts';
import type {Dataset} from './wallet.ts';
const fixture=():Dataset=>{const dates=Array.from({length:55},(_,i)=>new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10));return {dates,assets:{AAPL:{bars:dates.map(date=>({date,open:'100',high:'101',low:'99',close:'100',volume:'1'})),splits:[],checkedThrough:'2026-12-31'}},fx:Array.from({length:56},(_,i)=>({date:new Date(Date.UTC(2025,11,31+i)).toISOString().slice(0,10),usd:'2'}))};};
const buy={id:'buy-test-0001',symbol:'AAPL',side:'buy' as const,amount:'10'};
test('Varias ventas con pérdidas acumulan un resultado realizado negativo',()=>{const d=fixture(),s=newState('historical',d,'Pérdidas',0,0);queueOrder(s,d,buy);advance(s,d,d.dates[50]);d.assets.AAPL.bars[51].open='90';d.assets.AAPL.bars[52].open='90';for(const i of [51,52]){queueOrder(s,d,{id:'sell-loss-'+i,symbol:'AAPL',side:'sell',amount:'0.1'});advance(s,d,d.dates[i]);}assert.equal(s.realized,'-1.000000000000');assert.equal(s.cash,decimal(units('99')));});
test('Compra fraccionada y venta parcial/total conservan saldos y coste base',()=>{
 const data=fixture(),state=newState('historical',data,'Prueba',0,0);queueOrder(state,data,buy);assert.equal(state.cash,decimal(100n*units('1')));assert.equal(valueState(state,data).availableCash,decimal(units('90')));
 advance(state,data,data.dates[50]);assert.equal(state.cash,decimal(units('90')));assert.equal(state.positions.AAPL.quantity,decimal(units('0.2')));assert.equal(valueState(state,data).equity,decimal(units('100')));
 queueOrder(state,data,{id:'sell-test-0001',symbol:'AAPL',side:'sell',amount:'0.1'});advance(state,data,data.dates[51]);assert.equal(state.cash,decimal(units('95')));assert.equal(state.positions.AAPL.basis,decimal(units('5')));
 queueOrder(state,data,{id:'sell-test-0002',symbol:'AAPL',side:'sell',amount:'0.1'});advance(state,data,data.dates[52]);assert.deepEqual(state.positions,{});assert.equal(state.cash,decimal(units('100')));assert.equal(state.realized,decimal(0n));
});
test('Comisión, empeoramiento y redondeo nunca exceden el presupuesto',()=>{const f=calculateFill('buy','10','100','2',10,10);assert.ok(f.cash<=units('10'));assert.ok(f.fee>0n);assert.equal(f.effectiveUsd,units('100.1'));assert.ok(f.quantity<units('0.2'));const sale=calculateFill('sell',decimal(f.quantity),'100','2',10,10);assert.ok(sale.cash<f.cash);});
test('Reservas rechazan saldo/acciones insuficientes y duplicados no repiten órdenes',()=>{const d=fixture(),s=newState('historical',d,'Prueba');queueOrder(s,d,{...buy,amount:'70'});queueOrder(s,d,{...buy,amount:'70'});assert.equal(s.orders.length,1);assert.throws(()=>queueOrder(s,d,{...buy,id:'another-buy-1',amount:'31'}));assert.throws(()=>queueOrder(s,d,{...buy,id:'sell-empty-1',side:'sell',amount:'1'}));});
test('Divisas de la misma fecha o futuras se ignoran; faltantes bloquean',()=>{const d=fixture();assert.ok(fxBefore(d,d.dates[50]).date<d.dates[50]);d.fx=[{date:d.dates[50],usd:'999'}];assert.throws(()=>fxBefore(d,d.dates[50]));});
test('No se ejecuta en el cierre ni se salta una sesión, ni se repite el llenado',()=>{const d=fixture(),s=newState('historical',d,'Prueba',0,0);queueOrder(s,d,buy);assert.throws(()=>advance(s,d,s.cursor));assert.throws(()=>advance(s,d,d.dates[51]));advance(s,d,d.dates[50]);const cash=s.cash;advance(s,d,d.dates[51]);assert.equal(s.cash,cash);assert.equal(s.orders.filter(o=>o.status==='executed').length,1);});
test('Desdoblamientos y saltos sospechosos bloquean; verificación desconocida bloquea',()=>{for(const kind of ['split','gap','unknown']){const d=fixture(),s=newState('historical',d,'Prueba');if(kind==='split')d.assets.AAPL.splits=[s.cursor];if(kind==='gap')d.assets.AAPL.bars[49].open='200';if(kind==='unknown')d.assets.AAPL.checkedThrough=null;assert.throws(()=>queueOrder(s,d,buy));}});
test('Cancelación libera reservas y se conserva en historial',()=>{const d=fixture(),s=newState('historical',d,'Prueba');queueOrder(s,d,buy);s.orders[0].status='cancelled';assert.equal(valueState(s,d).availableCash,decimal(units('100')));advance(s,d,d.dates[50]);assert.deepEqual(s.positions,{});});
test('Persistencia, copia restaurada y rollback protegen de ejecuciones parciales',()=>{
 const dir=mkdtempSync(join(tmpdir(),'wallet-test-'));const file=join(dir,'wallet.sqlite'),backup=join(dir,'backup.sqlite');let db=new DatabaseSync(file);initializeWalletDb(db);const run=createWallet(db,'historical',fixture(),'Prueba',0,0);
 mutateWallet(db,run.id,(s,d)=>queueOrder(s,d,buy));
 assert.throws(()=>mutateWallet(db,run.id,(s,d)=>{advance(s,d,d.dates[50]);throw new Error('fallo simulado');}));assert.equal(readWallet(db,run.id).state.orders[0].status,'pending');
 mutateWallet(db,run.id,(s,d)=>advance(s,d,d.dates[50]));db.exec(`VACUUM INTO '${backup.replaceAll("'","''")}'`);db.close();db=new DatabaseSync(file);assert.equal(readWallet(db,run.id).state.cash,decimal(units('90')));db.close();const restored=new DatabaseSync(backup);assert.equal(readWallet(restored,run.id).state.orders[0].status,'executed');restored.close();unlinkSync(file);unlinkSync(backup);rmdirSync(dir);
});
