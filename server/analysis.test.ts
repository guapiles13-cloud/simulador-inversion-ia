import {test} from 'node:test';
import assert from 'node:assert/strict';
import {alignSeries,analyze,validateComment} from './analysis.ts';
import type {Bar} from './providers.ts';
const bars=(closes:string[]):Bar[]=>closes.map((close,i)=>({date:new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10),open:close,close,high:close,low:close,volume:'1'}));
test('Alinea por intersección, excluye huecos y fechas futuras sin rellenar',()=>{
  const a=bars(Array(52).fill('10'));const b=a.slice(0,51).filter((_,i)=>i!==10);
  const result=alignSeries([{symbol:'a',bars:a},{symbol:'b',bars:b}],['a','b'],a[49].date);
  assert.equal(result.count,49);assert.equal(result.asOf,a[49].date);assert.ok(result.series.every(s=>s.bars.every(b=>b.date<=a[49].date)));assert.ok(!result.ready);
});
test('Un activo ausente bloquea la comparación',()=>assert.equal(alignSeries([{symbol:'a',bars:bars(Array(60).fill('1'))}],['a','b']).count,0));
test('Calcula señales compra, venta, igualdad y datos insuficientes',()=>{
  assert.equal(analyze('x',bars([...Array(30).fill('100'),...Array(20).fill('110')])).signal,'COMPRA');
  assert.equal(analyze('x',bars([...Array(30).fill('110'),...Array(20).fill('100')])).signal,'VENTA');
  assert.equal(analyze('x',bars(Array(50).fill('100'))).signal,'MANTENER');
  assert.equal(analyze('x',bars(Array(49).fill('100'))).signal,'SIN_DATOS');
});
test('La comparación decimal exacta conserva diferencias menores al redondeo visual',()=>{
  const result=analyze('x',bars([...Array(30).fill('100'),...Array(20).fill('100.000000001')]));assert.equal(result.signal,'COMPRA');
});
test('El análisis histórico no usa cierres posteriores al corte',()=>{
  const data=bars([...Array(50).fill('100'),...Array(20).fill('1000')]);assert.equal(analyze('x',data,data[49].date).signal,'MANTENER');
});
test('Rechaza comentarios falsos, texto libre, garantías y campos extra',()=>{
  const a=analyze('x',bars(Array(50).fill('100')));
  const valid={signal:'MANTENER',comparison:'igual',concept:'promedio_cierres',risk:'sin_garantia'};
  assert.ok(validateComment(JSON.stringify(valid),a).includes('50'));
  for(const raw of ['Texto inventado',JSON.stringify({...valid,signal:'COMPRA'}),JSON.stringify({...valid,concept:'indice'}),JSON.stringify({...valid,risk:'ganancia_segura'}),JSON.stringify({...valid,extra:'noticia'})])assert.throws(()=>validateComment(raw,a));
});
