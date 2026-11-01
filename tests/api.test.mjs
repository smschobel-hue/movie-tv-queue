/* v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status. */
/* v1.0.0-rc.1 — 2026-10-30: API contract tests with isolated SQL and metadata mocks. */
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let sqlCalls = [], queryResult = [], fetched = [], failDb = false;
const context = vm.createContext({ Response, URL, Number, String, Set, Array, Object, AbortSignal,
  process: { env: { TMDB_READ_ACCESS_TOKEN: 'test', OMDB_API_KEY: 'test' } },
  console: { error() {}, warn() {} },
  fetch: async (url) => {
    fetched.push(String(url));
    if (String(url).includes('/search/multi')) return Response.json({results:[{id:42,media_type:'movie',title:'Test',release_date:'2024-01-01'}]});
    if (String(url).includes('omdbapi')) return Response.json({Response:'True',imdbRating:'8.1',Ratings:[{Source:'Rotten Tomatoes',Value:'93%'}]});
    return Response.json({id:42,title:'Test',release_date:'2024-01-01',imdb_id:'tt42',credits:{cast:[{name:'Actor'}]},'watch/providers':{results:{US:{flatrate:[{provider_name:'Service'}]}}}});
  }
});
const db = new vm.SyntheticModule(['sql'], function() {
 this.setExport('sql',async (strings,...values) => { sqlCalls.push({text:strings.join('?'),values}); if(failDb) throw Error('private'); return queryResult; });
}, {context});
const api = new vm.SourceTextModule(await readFile(new URL('../app/api/queue/route.js',import.meta.url),'utf8'), {context});
await api.link((specifier) => { assert.equal(specifier,'../../../lib/db'); return db; });
await api.evaluate();
const {GET,POST,DELETE} = api.namespace;
const req = (body, origin='https://queue.example') => new Request('https://queue.example/api/queue',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
assert.equal(api.namespace.PATCH, undefined, 'watched mutation endpoint is absent');
let count=0;
async function test(name, fn) { await fn(); count++; console.log('PASS', name); }
await test('GET returns shared rows in deterministic newest-first order',async()=>{queryResult=[{id:2},{id:1}]; assert.equal((await GET()).status,200); assert.match(sqlCalls.at(-1).text,/created_at DESC NULLS LAST, id DESC/);});
await test('blank name rejected', async()=>assert.equal((await POST(req({title:'Test'}))).status,400));
await test('malformed JSON rejected',async()=>assert.equal((await POST(new Request('https://queue.example',{method:'POST',body:'{'}))).status,400));
await test('cross-origin mutation rejected',async()=>assert.equal((await POST(req({title:'Test',addedBy:'Steve'},'https://other.example'))).status,403));
await test('search requires confirmation and does not insert',async()=>{let before=sqlCalls.length;let r=await POST(req({title:'Test',addedBy:'Steve'}));assert.equal((await r.json()).needsSelection,true);assert.equal(sqlCalls.length,before);});
await test('selected title binds schema-aligned metadata and ratings',async()=>{queryResult=[{id:3}];let r=await POST(req({title:'Test',addedBy:'Steve',tmdbId:42,mediaType:'movie'})); assert.equal(r.status,201); assert.deepEqual(Array.from(sqlCalls.at(-1).values),['Test','Movie',2024,'Service',8.1,93,'Actor','Steve',42,'movie']);assert.match(sqlCalls.at(-1).text,/ON CONFLICT DO NOTHING/);});
await test('duplicate yields 409',async()=>{queryResult=[];assert.equal((await POST(req({title:'Test',addedBy:'Steve',tmdbId:42,mediaType:'movie'}))).status,409);});
await test('invalid ID rejected before SQL',async()=>assert.equal((await DELETE(req({id:'1; DROP TABLE queue'}))).status,400));
await test('missing row yields 404',async()=>{queryResult=[];assert.equal((await DELETE(req({id:'1'}))).status,404);});
await test('shared removal succeeds',async()=>{queryResult=[{id:1}];assert.equal((await DELETE(req({id:'1'}))).status,200);assert.match(sqlCalls.at(-1).text,/DELETE FROM queue/);});
await test('database failures return generic errors',async()=>{failDb=true;const r=await GET();assert.equal(r.status,500);assert.equal((await r.json()).error,'Failed to load queue');});
console.log(`${count} API checks passed. These mocks do not verify a live database or metadata service.`);
