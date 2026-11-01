/* v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status. */
/* v1.0.0-rc.1 — 2026-10-30: migration and uniqueness tests on local PGlite PostgreSQL. */
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const migration=await readFile(new URL('../db/001_v1.sql',import.meta.url),'utf8');
const db=new PGlite();
await db.exec(`CREATE TABLE queue (id bigserial primary key,title text,type text,release_year integer,streaming_service text,imdb_rating numeric,rotten_tomatoes_rating integer,cast_members text,added_by text,created_at timestamptz default now()); INSERT INTO queue(title,type,release_year,added_by) VALUES ('Legacy','Movie',2020,'Steve');`);
await db.exec(migration);await db.exec(migration);
let rows=(await db.query('SELECT * FROM queue')).rows;
assert.equal(rows.length,1);assert.equal(rows[0].title,'Legacy');assert.equal('watched' in rows[0],false);console.log('PASS additive migration preserves legacy rows and can rerun');
let result=await db.query(`INSERT INTO queue(title,type,release_year) VALUES (' legacy ','Movie',2020) ON CONFLICT DO NOTHING RETURNING id`);assert.equal(result.rows.length,0);console.log('PASS normalized legacy duplicates blocked');
await db.query(`INSERT INTO queue(title,type,release_year,tmdb_id,media_type) VALUES ('New','Movie',2024,42,'movie')`);
result=await db.query(`INSERT INTO queue(title,type,release_year,tmdb_id,media_type) VALUES ('Renamed','Movie',2024,42,'movie') ON CONFLICT DO NOTHING RETURNING id`);assert.equal(result.rows.length,0);console.log('PASS metadata identity duplicates blocked');
await db.query(`INSERT INTO queue_profiles(browser_id,name) VALUES ('12345678-1234-4234-8234-123456789abc','Steve') ON CONFLICT(browser_id) DO UPDATE SET name=EXCLUDED.name`);assert.equal((await db.query('SELECT name FROM queue_profiles')).rows[0].name,'Steve');console.log('PASS profile table stores names');
await db.query(`DELETE FROM queue WHERE title='New'`);assert.equal((await db.query(`SELECT * FROM queue WHERE title='New'`)).rows.length,0);console.log('PASS removal persists');
await db.close();
const dup=new PGlite();await dup.exec(`CREATE TABLE queue(id bigserial primary key,title text,type text,release_year integer,created_at timestamptz); INSERT INTO queue(title,type,release_year) VALUES('Duplicate','Movie',2020),('Duplicate','Movie',2020);`);
await assert.rejects(()=>dup.exec(migration));await dup.exec('ROLLBACK');assert.equal((await dup.query('SELECT * FROM queue')).rows.length,2);console.log('PASS duplicate migration fails without deleting original data');await dup.close();
console.log('6 database checks passed on local PostgreSQL; live Neon remains untested.');
