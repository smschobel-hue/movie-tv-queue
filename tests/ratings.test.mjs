import test from 'node:test';
import assert from 'node:assert/strict';
import { omdbRatings, tmdbRatings } from '../lib/ratings.mjs';
const identity = { title: 'Fixture', year: 2020, mediaType: 'movie', imdbId: 'tt12345' };
const body = { Response: 'True', imdbRating: '8.1', Ratings: [{Source:'Rotten Tomatoes',Value:'93%'}] };
async function lookup(response, env={OMDB_API_KEY:'fixture-credential'}, id=identity) {
  const logs=[]; const requests=[];
  const value=await omdbRatings(id,{env,fetchImpl:async(url, options)=>{requests.push({url,options});if(response instanceof Error)throw response;return response;},log:e=>logs.push(e)});
  assert.ok(!JSON.stringify(logs).includes('fixture-credential'));
  return {value,logs,requests};
}
test('OMDb canonical IMDb identity and independent numeric ratings',async()=>{
 const {value,requests}=await lookup(Response.json(body));assert.deepEqual(value,{status:'ok',imdbRating:8.1,rottenTomatoesRating:93});assert.equal(requests[0].url.searchParams.get('i'),'tt12345');assert.equal(requests[0].url.protocol,'https:');assert.ok(requests[0].options.signal);
});
test('TV fallback uses series type and year when IMDb ID is absent',async()=>{
 const {requests}=await lookup(Response.json(body),undefined,{title:'Fixture',year:2022,mediaType:'tv'});assert.equal(requests[0].url.searchParams.get('type'),'series');assert.equal(requests[0].url.searchParams.get('y'),'2022');
});
test('missing configuration makes no provider request',async()=>{const r=await lookup(null,{});assert.equal(r.value.status,'missing_configuration');assert.equal(r.requests.length,0);});
for(const [status,code] of [[401,'authentication_failure'],[403,'authentication_failure'],[429,'rate_limit'],[503,'provider_error']])test('HTTP '+status+' diagnostics',async()=>assert.equal((await lookup(new Response('',{status}))).value.status,code));
for(const [message,code] of [['Invalid API key!','authentication_failure'],['Request limit reached!','rate_limit'],['Movie not found!','not_found'],['Other failure','provider_error']])test('OMDb payload '+code,async()=>assert.equal((await lookup(Response.json({Response:'False',Error:message}))).value.status,code));
test('timeout and network errors do not leak exception messages',async()=>{
 const timeout=Object.assign(Error('fixture-credential'),{name:'TimeoutError'});assert.equal((await lookup(timeout)).value.status,'timeout');const r=await lookup(Error('https://example/?apikey=fixture-credential'));assert.equal(r.value.status,'network_error');assert.equal(JSON.stringify(r.logs),'[{"provider":"omdb","status":"network_error"}]');
});
test('invalid JSON and shapes are differentiated from unavailable ratings',async()=>{
 for(const response of [new Response('{'),Response.json(null),Response.json([]),Response.json({})])assert.equal((await lookup(response)).value.status,'invalid_response');
 assert.equal((await lookup(Response.json({Response:'True',imdbRating:'N/A',Ratings:[]}))).value.status,'ratings_unavailable');
});
test('partial scores, zeros and malformed/out-of-range scores',async()=>{
 assert.equal((await lookup(Response.json({...body,Ratings:[]}))).value.status,'partial');
 const zero=(await lookup(Response.json({...body,imdbRating:'0',Ratings:[{Source:'Rotten Tomatoes',Value:'0%'}]}))).value;assert.equal(zero.imdbRating,0);assert.equal(zero.rottenTomatoesRating,0);
 const bad=(await lookup(Response.json({...body,imdbRating:'99junk',Ratings:[{Source:'Rotten Tomatoes',Value:'101%'}]}))).value;assert.equal(bad.status,'ratings_unavailable');
});
test('TMDB scores require votes, keep real zero, reject invalid values',()=>{
 assert.deepEqual(tmdbRatings({vote_average:8.25,vote_count:123}),{tmdbRating:8.25,tmdbVoteCount:123});
 assert.equal(tmdbRatings({vote_average:0,vote_count:4}).tmdbRating,0);
 for(const data of [{vote_average:7,vote_count:0},{vote_average:11,vote_count:2},{vote_average:'8',vote_count:2},{vote_average:NaN,vote_count:2},{vote_average:7,vote_count:-1},{}])assert.equal(tmdbRatings(data).tmdbRating,null);
});
