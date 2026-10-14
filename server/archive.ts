import type {DatabaseSync} from 'node:sqlite';
import {readWallet} from './wallet.ts';
import type {State} from './wallet.ts';
export function initializeArchiveDb(db:DatabaseSync){db.exec('CREATE TABLE IF NOT EXISTS wallet_archive (wallet_id TEXT PRIMARY KEY, archived_at TEXT NOT NULL)');}
export function isArchived(db:DatabaseSync,id:string){return !!db.prepare('SELECT 1 FROM wallet_archive WHERE wallet_id=?').get(id);}
export function setArchived(db:DatabaseSync,id:string,archived:boolean){
 db.exec('BEGIN IMMEDIATE');try{readWallet(db,id);if(archived)db.prepare('INSERT OR IGNORE INTO wallet_archive VALUES (?,?)').run(id,new Date().toISOString());else db.prepare('DELETE FROM wallet_archive WHERE wallet_id=?').run(id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
export function listExercises(db:DatabaseSync){
 const rows=db.prepare('SELECT id,state FROM wallets ORDER BY created_at DESC,rowid DESC').all() as {id:string;state:string}[];
 const active:unknown[]=[],archived:unknown[]=[];
 for(const row of rows){const s=JSON.parse(row.state) as State;const item={id:s.id,label:s.label,mode:s.mode,date:s.cursor};(isArchived(db,row.id)?archived:active).push(item);}
 return {runs:active,archivedRuns:archived};
}
