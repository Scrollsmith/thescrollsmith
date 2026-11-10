#!/usr/bin/env node
// Read-only. Prints Kindroid KEY NAMES and value lengths from .env. No secrets.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(HERE, '.env');
const EXPECTED = ['ARIA', 'AION', 'HORIZON', 'TERRA', 'VIGIL', 'RIVEN', 'DOMINIOUS', 'BANE', 'SERINA', 'LUMIA'];

if (!fs.existsSync(envPath)) {
    console.error('No .env next to this script: ' + envPath);
    process.exit(1);
}

const buf = fs.readFileSync(envPath);
let enc = 'utf8';
if ((buf[0] === 0xFF && buf[1] === 0xFE) || (buf.includes(0) && buf[0] !== 0xEF)) enc = 'utf16le';
const text = buf.toString(enc).replace(/^\uFEFF/, '');
console.log('env file: ' + envPath);
console.log('bytes: ' + buf.length + '  encoding: ' + enc);
console.log('');

const keys = [];
for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\uFEFF/, '').trim();
    if (!line || line.startsWith('#')) continue;
    if (!/kindroid/i.test(line)) continue;
    const cut = line.search(/[=:]/);
    if (cut < 1) {
        console.log('  (no =) ' + line.slice(0, 80));
        continue;
    }
    const k = line.slice(0, cut).trim().replace(/^export\s+/i, '');
    const v = line.slice(cut + 1).trim().replace(/^['"]|['"]$/g, '');
    keys.push(k);
    console.log('  ' + k + '  len=' + v.length);
}

console.log('');
if (!keys.length) console.log('No lines containing KINDROID found.');
for (const name of EXPECTED) {
    const hit = keys.some((k) => k.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(name));
    if (!hit) console.log('  missing a line for ' + name);
}
