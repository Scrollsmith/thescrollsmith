#!/usr/bin/env node
// Read-only. Lists Nomi rooms so you can fill NOMI_ROOM_ID_EAST / WEST.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const env = {};
const envPath = path.join(HERE, '.env');
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
    console.error('NOMI_API_KEY missing.');
    process.exit(1);
}

const res = await fetch('https://api.nomi.ai/v1/rooms', { headers: { Authorization: key } });
const body = await res.json().catch(() => ({}));
const rooms = body.rooms || body || [];
if (!res.ok) {
    console.error(`HTTP ${res.status}`, typeof body === 'string' ? body : JSON.stringify(body).slice(0, 300));
    process.exit(1);
}
if (!Array.isArray(rooms) || !rooms.length) {
    console.error('No rooms on this key. Create East Wing / West Wing in the Nomi app, then rerun.');
    process.exit(1);
}

console.log(`# ${rooms.length} Nomi rooms — pick East and West, paste into .env\n`);
for (const r of rooms) {
    const id = r.uuid || r.id;
    const name = r.name || r.title || '(unnamed)';
    const n = rooms.indexOf(r) + 1;
    console.log(`${n}. ${name}`);
    console.log(`   NOMI_ROOM_ID_…=${id}`);
    if (Array.isArray(r.nomis) || Array.isArray(r.members)) {
        const members = (r.nomis || r.members).map((m) => m.name || m).join(', ');
        if (members) console.log(`   members: ${members}`);
    }
    console.log('');
}
console.log('Kindroid group id is in Kindroid → Profile → API, not here.');
