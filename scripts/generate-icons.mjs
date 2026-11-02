/* v1.0.0-rc.3 — RC2-DEF-003: deterministic derivatives, never edit original. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const original = await readFile(new URL('../app/Icon.png', import.meta.url));
const expected = '907a6c130c28fec666f623e9e31fc07c43e7d0f41aaa0052acae055ad4b2de04';
if (createHash('sha256').update(original).digest('hex') !== expected) throw new Error('Original artwork changed.');
const variants = { 'favicon-16.png': 16, 'favicon-32.png': 32, 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180, 'apple-touch-icon-167.png': 167, 'apple-touch-icon-152.png': 152 };
for (const [name, size] of Object.entries(variants)) await sharp(original).resize(size, size).png().toFile(fileURLToPath(new URL('../public/' + name, import.meta.url)));
const pngs = await Promise.all([16,32,48].map(size => sharp(original).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * pngs.length); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => { const n = 6 + i * 16; header[n] = header[n+1] = [16,32,48][i]; header.writeUInt16LE(1,n+4); header.writeUInt16LE(32,n+6); header.writeUInt32LE(png.length,n+8); header.writeUInt32LE(offset,n+12); offset += png.length; });
await writeFile(new URL('../public/favicon.ico',import.meta.url), Buffer.concat([header,...pngs]));
console.log('Generated favicon, Apple and manifest icons; original artwork hash verified.');
