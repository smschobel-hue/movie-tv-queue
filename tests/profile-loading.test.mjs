import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
const require=createRequire(import.meta.url);
const {transform}=require('next/dist/build/swc');
const source=await readFile(new URL('../app/page.js',import.meta.url),'utf8');
const compiled=await transform(source,{filename:'page.js',jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
const module={exports:{}};
vm.runInNewContext(compiled.code,{module,exports:module.exports,require,fetch:(...args)=>globalThis.fetch(...args),AbortSignal,console,setInterval:()=>1,clearInterval(){},window:{addEventListener(){},removeEventListener(){}},document:{visibilityState:'visible'}});
const Home=module.exports.default;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
for(const failure of ['network','http','invalid-json']) {
 test(`profile ${failure} failure keeps controls usable`,async()=>{
  globalThis.fetch=async url=>{
   if(url==='/api/queue') return Response.json([]);
   if(failure==='network') throw Error('offline');
   if(failure==='http') return Response.json({error:'unavailable'},{status:500});
   return new Response('{');
  };
  let tree;
  await act(async()=>{tree=TestRenderer.create(React.createElement(Home));});
  assert.ok(tree.root.findAllByType('button').every(button=>!button.props.disabled));
  assert.match(JSON.stringify(tree.toJSON()),/Enter your name to continue/);
  globalThis.fetch=async()=>Response.json({name:'Retry'});
  await act(async()=>tree.root.findByProps({id:'user-name'}).props.onChange({target:{value:'Retry'}}));
  await act(async()=>tree.root.findAllByType('button').find(b=>b.children.includes('Save name')).props.onClick());
  assert.match(JSON.stringify(tree.toJSON()),/Name saved/);
  await act(async()=>tree.unmount());
 });
}
test('late profile response does not overwrite typed name; save can retry',async()=>{
 let resolveProfile;
 const profile=new Promise(resolve=>{resolveProfile=resolve;});
 globalThis.fetch=async(url,options)=>url==='/api/queue'?Response.json([]):options?.method==='PUT'?Response.json({name:'Manual'}):profile;
 let tree;
 await act(async()=>{tree=TestRenderer.create(React.createElement(Home));});
 await act(async()=>tree.root.findByProps({id:'user-name'}).props.onChange({target:{value:'Manual'}}));
 await act(async()=>resolveProfile(Response.json({name:'Old saved name'})));
 assert.equal(tree.root.findByProps({id:'user-name'}).props.value,'Manual');
 await act(async()=>tree.root.findAllByType('button').find(b=>b.children.includes('Save name')).props.onClick());
 assert.match(JSON.stringify(tree.toJSON()),/Name saved/);
 await act(async()=>tree.unmount());
});
