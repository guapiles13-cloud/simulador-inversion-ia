import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDaily,parseFx} from './providers.ts';
const series = Object.fromEntries(Array.from({length:60},(_,i)=>[new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10),{'1. open':'10.10','2. high':'11','3. low':'9','4. close':'10','5. volume':'100'}]));
test('Conserva los decimales del proveedor y ordena las sesiones',()=>{const rows=parseDaily({'Time Series (Daily)':series});assert.equal(rows.length,60);assert.equal(rows[0].open,'10.10');assert.ok(rows[0].date<rows[59].date);});
test('Rechaza cuota agotada y datos insuficientes',()=>{assert.throws(()=>parseDaily({Information:'rate limit'}));assert.throws(()=>parseDaily({'Time Series (Daily)':{}}));});
test('Rechaza OHLC incoherente',()=>assert.throws(()=>parseDaily({'Time Series (Daily)':{...series,'2026-01-01':{'1. open':'20','2. high':'11','3. low':'9','4. close':'10','5. volume':'1'}}})));
test('Extrae referencias del BCE con comillas simples o dobles',()=>{assert.deepEqual(parseFx(`<Cube time='2026-01-02'><Cube currency='USD' rate='1.17'/></Cube>`),[{date:'2026-01-02',usd:'1.17'}]);assert.throws(()=>parseFx('<html>Error</html>'));});
