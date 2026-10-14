import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime,allowRequest,ollamaBaseUrl} from './runtime.ts';

test('Ollama mantiene el servicio local y permite una dirección privada configurable',()=>{
 assert.equal(ollamaBaseUrl({}),'http://127.0.0.1:11434');
 assert.equal(ollamaBaseUrl({OLLAMA_BASE_URL:'http://ollama:11434/'}),'http://ollama:11434');
 for(const value of ['file:///data','https://user:secret@host','https://host?token=secret'])assert.throws(()=>ollamaBaseUrl({OLLAMA_BASE_URL:value}));
});

test('El modo local conserva el enlace, origen y acceso actuales',()=>{
 const c=runtime({},'/app');assert.equal(c.host,'127.0.0.1');assert.equal(c.origin,'http://127.0.0.1:4318');
 assert.equal(allowRequest({host:c.authority},'GET','/',c),200);
 assert.equal(allowRequest({host:c.authority,origin:'https://otro.example'},'POST','/api/wallet/order',c),403);
 assert.equal(allowRequest({host:'otro.example'},'GET','/',c),403);
});
test('El alojamiento exige origen seguro y credenciales antes de abrir el servidor',()=>{
 assert.throws(()=>runtime({APP_MODE:'hosted'},'/app'));
 assert.throws(()=>runtime({APP_MODE:'hosted',PUBLIC_ORIGIN:'https://app.example'},'/app'));
 for(const origin of ['http://app.example','https://app.example/ruta','https://user:secret@app.example','https://app.example?x=1'])assert.throws(()=>runtime({APP_MODE:'hosted',PUBLIC_ORIGIN:origin,REVIEW_PASSWORD:'x'.repeat(24)},'/app'));
});
test('Todas las carteras, exportaciones y acciones alojadas requieren acceso; salud no muestra datos',()=>{
 const c=runtime({APP_MODE:'hosted',PUBLIC_ORIGIN:'https://app.example',REVIEW_PASSWORD:'x'.repeat(24),DATA_DIR:'/persist',AUTO_CHECKS:'false'},'/app');
 assert.equal(c.host,'0.0.0.0');assert.equal(c.autoChecks,false);
 for(const path of ['/','/api/wallets','/api/wallet','/api/wallet/export','/api/check','/api/explain','/api/wallet/restore']){
  assert.equal(allowRequest({host:c.authority},'GET',path,c),401);
  assert.equal(allowRequest({host:c.authority,authorization:'Basic wrong'},'POST',path,c),401);
  assert.equal(allowRequest({host:c.authority,authorization:c.authorization!,origin:c.origin},'POST',path,c),200);
  assert.equal(allowRequest({host:c.authority,authorization:c.authorization!,origin:'https://otro.example'},'POST',path,c),403);
 }
 assert.equal(allowRequest({host:c.authority},'GET','/api/health',c),200);
 assert.equal(allowRequest({host:c.authority},'POST','/api/health',c),401);
});
