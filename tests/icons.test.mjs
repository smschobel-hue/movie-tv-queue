import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
test('original custom artwork is byte-for-byte preserved',async()=>{
 assert.equal(createHash('sha256').update(await readFile(new URL('../app/Icon.png',import.meta.url))).digest('hex'),'907a6c130c28fec666f623e9e31fc07c43e7d0f41aaa0052acae055ad4b2de04');
});
test('all derivatives match resizing the original; dimensions and manifest links agree',async()=>{
 const original=await readFile(new URL('../app/Icon.png',import.meta.url));
 const variants={'favicon-16.png':16,'favicon-32.png':32,'apple-touch-icon.png':180,'apple-touch-icon-167.png':167,'apple-touch-icon-152.png':152,'icon-192.png':192,'icon-512.png':512};
 for(const [name,size] of Object.entries(variants)){
 const b=await readFile(new URL('../public/'+name,import.meta.url));const meta=await sharp(b).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);assert.deepEqual(await sharp(b).raw().toBuffer(),await sharp(original).resize(size,size).raw().toBuffer());
 }
 const m=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url)));assert.equal(m.display,'standalone');assert.equal(m.id,'/');assert.equal(m.scope,'/');
 for(const icon of m.icons)assert.equal(icon.sizes,`${variants[icon.src.slice(1)]}x${variants[icon.src.slice(1)]}`);
});
test('ICO contains valid 16/32/48 PNG entries',async()=>{
 const b=await readFile(new URL('../public/favicon.ico',import.meta.url));assert.equal(b.readUInt16LE(2),1);assert.equal(b.readUInt16LE(4),3);
 for(let i=0;i<3;i++){const n=6+16*i;const size=b.readUInt32LE(n+8),offset=b.readUInt32LE(n+12);const meta=await sharp(b.subarray(offset,offset+size)).metadata();assert.equal(meta.width,[16,32,48][i]);}
});
