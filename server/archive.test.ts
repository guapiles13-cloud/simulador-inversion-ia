import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {initializeWalletDb} from './wallet.ts';
import {initializeArchiveDb,isArchived,setArchived,listExercises} from './archive.ts';
test('Quitar y restaurar conserva estado, datos, órdenes y comparación',()=>{
 const db=new DatabaseSync(':memory:');initializeWalletDb(db);initializeArchiveDb(db);db.exec('CREATE TABLE comparisons(wallet_id TEXT PRIMARY KEY,value TEXT)');
 const state=JSON.stringify({id:'test-archive',label:'Prueba',mode:'historical',cursor:'2026-08-03',cash:'90',orders:[{status:'pending'}]});
 db.prepare('INSERT INTO wallets VALUES (?,?,?,?)').run('test-archive','2026-10-14',state,'{"prices":"conservados"}');db.prepare('INSERT INTO comparisons VALUES (?,?)').run('test-archive','{"automatic":"conservada"}');
 setArchived(db,'test-archive',true);setArchived(db,'test-archive',true);assert.ok(isArchived(db,'test-archive'));assert.equal(listExercises(db).runs.length,0);assert.equal(listExercises(db).archivedRuns.length,1);
 assert.equal(db.prepare('SELECT state FROM wallets').get()!.state,state);assert.equal(db.prepare('SELECT value FROM comparisons').get()!.value,'{"automatic":"conservada"}');
 setArchived(db,'test-archive',false);setArchived(db,'test-archive',false);assert.equal(listExercises(db).runs.length,1);assert.equal(listExercises(db).archivedRuns.length,0);assert.equal(db.prepare('SELECT dataset FROM wallets').get()!.dataset,'{"prices":"conservados"}');db.close();
});
test('Un ejercicio inexistente no deja marcas ni una transacción abierta',()=>{const db=new DatabaseSync(':memory:');initializeWalletDb(db);initializeArchiveDb(db);assert.throws(()=>setArchived(db,'missing',true));assert.equal(db.prepare('SELECT count(*) n FROM wallet_archive').get()!.n,0);assert.doesNotThrow(()=>db.exec('BEGIN; ROLLBACK'));db.close();});
