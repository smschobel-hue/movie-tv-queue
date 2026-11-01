/* v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status. */
/* v1.0.0-rc.1 — 2026-10-30: Neon profile and browser-cookie contract tests. */
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
let savedCookie, cookieOptions, savedName='', calls=[];
const context=vm.createContext({Response,URL,process:{env:{NODE_ENV:'production'}},console:{error(){}}});
const mods={
 'next/headers':new vm.SyntheticModule(['cookies'],function(){this.setExport('cookies',async()=>({get:()=>savedCookie?{value:savedCookie}:undefined,set:(key,value,options)=>{savedCookie=value;cookieOptions=options;}}));},{context}),
 'node:crypto':new vm.SyntheticModule(['randomUUID'],function(){this.setExport('randomUUID',()=> '12345678-1234-4234-8234-123456789abc');},{context}),
 '../../../lib/db':new vm.SyntheticModule(['sql'],function(){this.setExport('sql',async(strings,...values)=>{calls.push(values);if(strings.join('').includes('INSERT')){savedName=values[1];return [];}return savedName?[{name:savedName}]:[];});},{context})
};
const mod=new vm.SourceTextModule(await readFile(new URL('../app/api/profile/route.js',import.meta.url),'utf8'),{context});
await mod.link(spec=>{assert.ok(mods[spec],spec);return mods[spec];}); await mod.evaluate();
const {GET,PUT}=mod.namespace;
const req=(body,origin='https://queue.example')=>new Request('https://queue.example/api/profile',{method:'PUT',headers:{origin},body:JSON.stringify(body)});
assert.equal((await GET()).status,200);assert.equal(cookieOptions.httpOnly,true);assert.equal(cookieOptions.secure,true);assert.equal(cookieOptions.sameSite,'lax');console.log('PASS opaque secure HttpOnly profile cookie');
assert.equal((await PUT(req({name:' Steve '}))).status,200);assert.equal(savedName,'Steve');assert.equal((await (await GET()).json()).name,'Steve');console.log('PASS Neon-backed name round trip');
assert.equal((await PUT(req({name:''}))).status,400);assert.equal((await PUT(req({name:'a'.repeat(101)}))).status,400);console.log('PASS invalid names rejected');
assert.equal((await PUT(req({name:'Steve'},'https://other.example'))).status,403);console.log('PASS cross-origin name changes rejected');
console.log('4 profile checks passed. Database and cookies are mocked.');
