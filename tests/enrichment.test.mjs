import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { assertPreview, PREVIEW_BRANCH, digest, validatePlan, missingRatings, UPDATE_SQL, updateParameters } from '../lib/enrichment.mjs';
const env={DATABASE_URL:'postgresql://fixture:fixture@ep-purple-fog-awwknv2v.c-12.us-east-1.aws.neon.tech/neondb',ENRICHMENT_SCOPE:PREVIEW_BRANCH,ENRICHMENT_WRITE_APPROVED:PREVIEW_BRANCH};
test('scope blocks production, wrong database, arbitrary hosts and missing acknowledgement',()=>{
 assertPreview(env);
 for(const change of [{VERCEL_ENV:'production'},{ENRICHMENT_SCOPE:''},{DATABASE_URL:'postgresql://fixture:fixture@production.example/neondb'},{DATABASE_URL:env.DATABASE_URL.replace('/neondb','/postgres')}])assert.throws(()=>assertPreview({...env,...change}));
});
test('approved plan is digest-bound, short-lived and limited to rating fields',()=>{
 const plan={version:1,branch:PREVIEW_BRANCH,createdAt:new Date().toISOString(),rows:[{id:'1',fingerprint:'a'.repeat(32),patch:{imdb_rating:8}}]};
 validatePlan(plan,digest(plan),env);
 assert.throws(()=>validatePlan(plan,'wrong',env));assert.throws(()=>validatePlan(plan,digest(plan),{...env,ENRICHMENT_WRITE_APPROVED:''}));
 for(const modified of [{...plan,createdAt:'2000-01-01'}, {...plan,rows:[{...plan.rows[0],patch:{title:3}}]}, {...plan,rows:[{...plan.rows[0],patch:{imdb_rating:11}}]}])assert.throws(()=>validatePlan(modified,digest(modified),env));
});
test('only missing ratings are proposed; existing values are retained',()=>{
 assert.deepEqual(missingRatings({imdb_rating:'7.2',rotten_tomatoes_rating:0},{imdb_rating:8,rotten_tomatoes_rating:90,tmdb_rating:8}),{tmdb_rating:8});
});
test('SQL preserves IDs, timestamps, name and metadata; retry and stale plan cannot overwrite',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`CREATE TABLE queue(id bigint primary key,title text,added_by text,created_at timestamptz,imdb_rating numeric,rotten_tomatoes_rating integer,tmdb_rating numeric,tmdb_vote_count bigint,ratings_fetched_at timestamptz); INSERT INTO queue VALUES(1,'Keep','Name','2026-01-01',7.2,NULL,NULL,NULL,NULL);`);
 const original=(await db.query('SELECT * FROM queue')).rows[0];
 const fingerprint=(await db.query('SELECT md5(to_jsonb(q)::text) AS hash FROM queue q')).rows[0].hash;
 const row={id:'1',fingerprint,patch:{imdb_rating:9,rotten_tomatoes_rating:93,tmdb_rating:8.4,tmdb_vote_count:20}};
 assert.equal((await db.query(UPDATE_SQL,updateParameters(row,'2026-11-02T12:00:00Z'))).rows.length,1);
 const after=(await db.query('SELECT * FROM queue')).rows[0];
 for(const key of ['id','title','added_by','created_at','imdb_rating'])assert.deepEqual(after[key],original[key]);
 assert.equal(Number(after.tmdb_rating),8.4);assert.equal(after.rotten_tomatoes_rating,93);
 assert.equal((await db.query(UPDATE_SQL,updateParameters(row,'2026-11-02T12:00:00Z'))).rows.length,0);
 const fresh=(await db.query('SELECT md5(to_jsonb(q)::text) AS hash FROM queue q')).rows[0].hash;
 await db.exec("UPDATE queue SET title='Changed by user' WHERE id=1");
 assert.equal((await db.query(UPDATE_SQL,updateParameters({...row,fingerprint:fresh},'2026-11-02T12:00:00Z'))).rows.length,0);
 }finally{await db.close();}
});
