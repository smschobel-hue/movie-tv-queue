import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('RC.3 migration is additive, repeatable, preserves legacy rows and validates score ranges',async()=>{
 const db=new PGlite();try{
 await db.exec(await readFile(new URL('../db/001_v1.sql',import.meta.url),'utf8'));
 await db.exec("INSERT INTO queue(title,type,added_by,created_at) VALUES('Fixture','TV','Name','2026-01-01')");
 const before=(await db.query('SELECT id,title,type,added_by,created_at FROM queue')).rows;
 const migration=await readFile(new URL('../db/002_rc3_ratings.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
 assert.deepEqual((await db.query('SELECT id,title,type,added_by,created_at FROM queue')).rows,before);
 assert.equal((await db.query('SELECT tmdb_rating FROM queue')).rows[0].tmdb_rating,null);
 await db.exec('UPDATE queue SET tmdb_rating=0,tmdb_vote_count=1');
 await assert.rejects(()=>db.exec('UPDATE queue SET tmdb_rating=11'));
 await assert.rejects(()=>db.exec('UPDATE queue SET tmdb_vote_count=-1'));
 }finally{await db.close();}
});
