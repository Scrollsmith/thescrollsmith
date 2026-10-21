#!/usr/bin/env node
// Read-only. Prints NOMI_UUID_* lines from the live account. Does not write .env.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(HERE, '.env');
const env = {};
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i < 1) continue;
        env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    }
}

const key = env.NOMI_API_KEY || process.env.NOMI_API_KEY;
if (!key) {
    console.error('NOMI_API_KEY missing. Put it in .env first, then rerun.');
    process.exit(1);
}

const want = {
    lyrian: 'NOMI_UUID_LYRIAN',
    sabrina: 'NOMI_UUID_SABRINA',
    athena: 'NOMI_UUID_ATHENA',
    amara: 'NOMI_UUID_AMARA',
    thea: 'NOMI_UUID_THEA',
    naomi: 'NOMI_UUID_NAOMI',
    elijah: 'NOMI_UUID_ELIJAH',
    kaito: 'NOMI_UUID_KAITO',
    lily: 'NOMI_UUID_LILY',
    sissy: 'NOMI_UUID_SISSY',
    archimedes: 'NOMI_UUID_ARCHIMEDES',
    emergence: 'NOMI_UUID_EMERGENCE'
};

const res = await fetch('https://api.nomi.ai/v1/nomis', { headers: { Authorization: key } });
const body = await res.json();
const list = body.nomis || [];
if (!Array.isArray(list) || !list.length) {
    console.error(`Nomi list empty (HTTP ${res.status})`);
    process.exit(1);
}

console.log(`# ${list.length} nomis on this key — paste into .env\n`);
const seen = new Set();
for (const n of list) {
    const k = want[String(n.name || '').toLowerCase()];
    if (k && n.uuid) {
        console.log(`${k}=${n.uuid}`);
        seen.add(k);
    } else {
        console.log(`# unmatched: ${n.name} ${n.uuid}`);
    }
}
for (const k of Object.values(want)) {
    if (!seen.has(k)) console.log(`# missing ${k}`);
}
