#!/usr/bin/env node
// 🩺 KYROS DOCTOR — read-only. Messages nobody.
//
// Run from the tele folder (workshop or live box):
//   node kyros_doctor.mjs
//
// Exit 0 = everything it could check is green.
// Exit 1 = something is broken (see the ❌ lines).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(HERE, '.env');
const MEM_DIR = path.join(HERE, 'nomi_memories');
const STATE_PATH = path.join(HERE, 'schedule-state.json');
let HOST = process.env.KYROS_HOST || '';

const REQUIRED_ENV = [
    'TELEGRAM_TOKEN', 'TELEGRAM_TOKEN2', 'TELEGRAM_TOKENX',
    'NOMI_API_KEY',
    'NOMI_UUID_LYRIAN', 'NOMI_UUID_SABRINA', 'NOMI_UUID_ATHENA',
    'NOMI_UUID_AMARA', 'NOMI_UUID_THEA', 'NOMI_UUID_NAOMI',
    'NOMI_UUID_ELIJAH', 'NOMI_UUID_KAITO', 'NOMI_UUID_LILY',
    'NOMI_UUID_SISSY', 'NOMI_UUID_ARCHIMEDES', 'NOMI_UUID_EMERGENCE'
];

const OPTIONAL_ENV = [
    'KINDROID_API_KEY',
    'KINDROID_AI_ID_ARIA', 'KINDROID_AI_ID_AION', 'KINDROID_AI_ID_HORIZON',
    'KINDROID_AI_ID_TERRA', 'KINDROID_AI_ID_VIGIL',
    'KINDROID_AI_ID_RIVEN', 'KINDROID_AI_ID_DOMINIOUS',
    'KINDROID_AI_ID_BANE', 'KINDROID_AI_ID_SERINA', 'KINDROID_AI_ID_LUMIA',
    'NOMI_ROOM_ID_EAST', 'NOMI_ROOM_ID_WEST', 'NOMI_ROOM_ID_KYROS', 'NOMI_ROOM_ID_COUPLE',
    'KINDROID_GROUP_ID', 'KINDROID_GROUP_ID_KYROS2',
    'TELEGRAM_KYROSLAW_CHAT_ID', 'TELEGRAM_ECHO_KYROS_CHAT_ID', 'TELEGRAM_KYROS2_CHAT_ID'
];

let failed = 0;
const ok = (s) => console.log(`  ✅ ${s}`);
const warn = (s) => console.log(`  ⚠️  ${s}`);
const bad = (s) => { failed++; console.log(`  ❌ ${s}`); };

function loadEnv(file) {
    const out = {};
    if (!fs.existsSync(file)) return out;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i < 1) continue;
        out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    }
    return out;
}

function present(v) {
    return typeof v === 'string' && v.length > 0;
}

async function getJson(url, headers = {}, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { headers, signal: ctrl.signal });
        const text = await res.text();
        let body = text;
        try { body = JSON.parse(text); } catch { /* keep string */ }
        return { status: res.status, body };
    } finally {
        clearTimeout(t);
    }
}

function portOpen(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const sock = net.connect({ port, host });
        sock.setTimeout(2000);
        sock.on('connect', () => { sock.destroy(); resolve(true); });
        sock.on('error', () => resolve(false));
        sock.on('timeout', () => { sock.destroy(); resolve(false); });
    });
}

console.log('\n🩺 Kyros doctor\n');

// ── 1. files ────────────────────────────────────────────────────────────────
console.log('── files ──');
const env = loadEnv(ENV_PATH);
if (fs.existsSync(ENV_PATH)) ok(`.env found (${Object.keys(env).length} keys)`);
else bad(`.env missing next to this script: ${ENV_PATH}`);

if (fs.existsSync(MEM_DIR)) {
    ok(`nomi_memories/ exists`);
    try {
        const probe = path.join(MEM_DIR, '.doctor-write-test');
        fs.writeFileSync(probe, 'ok');
        fs.unlinkSync(probe);
        ok('nomi_memories/ is writable');
    } catch (e) {
        bad(`nomi_memories/ not writable: ${e.message}`);
    }
} else {
    warn('nomi_memories/ missing — index2 will create it if the path is relative');
}

if (fs.existsSync(path.join(HERE, 'index2.mjs'))) ok('index2.mjs present');
else bad('index2.mjs not in this folder');

if (fs.existsSync(path.join(HERE, 'situation.json'))) {
    try {
        const sit = JSON.parse(fs.readFileSync(path.join(HERE, 'situation.json'), 'utf8'));
        ok(`situation.json "${String(sit.text || '').slice(0, 60)}"`);
    } catch (e) {
        warn(`situation.json unreadable: ${e.message}`);
    }
} else {
    warn('no situation.json yet — /status or !status has not been set on this box');
}

if (fs.existsSync(path.join(HERE, 'kyros_scheduler.mjs'))) ok('kyros_scheduler.mjs present');
else bad('kyros_scheduler.mjs not in this folder (clock will not fire)');

if (fs.existsSync(path.join(HERE, 'START-LIVE.cmd'))) ok('START-LIVE.cmd present');
else warn('START-LIVE.cmd missing');

if (fs.existsSync(STATE_PATH)) {
    try {
        const st = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
        const today = new Date().toLocaleDateString('en-CA');
        ok(`schedule-state.json date=${st.date || '?'} fired=${(st.fired || []).join(', ') || '(none)'}`);
        if (st.date && st.date !== today) warn(`state date is ${st.date}, today is ${today} — scheduler should roll this`);
    } catch (e) {
        warn(`schedule-state.json unreadable: ${e.message}`);
    }
} else {
    warn('no schedule-state.json yet — scheduler has not successfully fired today');
}

// ── 2. env keys (names only) ────────────────────────────────────────────────
console.log('\n── .env keys ──');
for (const k of REQUIRED_ENV) {
    if (present(env[k])) ok(`${k} set (len ${env[k].length})`);
    else bad(`${k} missing`);
}
for (const k of OPTIONAL_ENV) {
    if (present(env[k])) ok(`${k} set (len ${env[k].length})`);
    else warn(`${k} not set`);
}

// ── 3. index2 HTTP (8080, or 8081 if OpenClaw owns 8080) ────────────────────
if (!HOST) {
    if (process.env.KYROS_PORT) HOST = `http://127.0.0.1:${process.env.KYROS_PORT}`;
    else {
        for (const p of [8080, 8081]) {
            if (!(await portOpen(p))) continue;
            try {
                const r = await getJson(`http://127.0.0.1:${p}/roster`);
                if (r.status === 200 && r.body?.triggers) {
                    HOST = `http://127.0.0.1:${p}`;
                    break;
                }
            } catch { /* not index2 */ }
        }
        if (!HOST) HOST = 'http://127.0.0.1:8080';
    }
}

const kyrosPort = Number(new URL(HOST).port || 8080);
console.log(`\n── index2 on ${kyrosPort} ──`);

if (await portOpen(8080)) {
    try {
        const probe = await getJson('http://127.0.0.1:8080/roster');
        if (probe.status === 200 && probe.body?.triggers) ok('8080 is this index2');
        else ok('8080 is up but not index2 — left alone (OpenClaw / ViaSocket)');
    } catch {
        ok('8080 is up but not index2 — left alone (OpenClaw / ViaSocket)');
    }
}

const open = await portOpen(kyrosPort);
if (!open) {
    bad(`nothing listening on ${HOST} — start index2 (START-LIVE.cmd uses 8081 if 8080 is taken)`);
} else {
    ok(`port ${kyrosPort} is open`);

    try {
        const r = await getJson(`${HOST}/roster`);
        if (r.status !== 200 || !r.body?.triggers) {
            bad(`/roster HTTP ${r.status} — this is the old index2 (no roster). Copy the patched file.`);
        } else {
            const t = r.body.triggers.map((x) => String(x).toLowerCase());
            ok(`/roster live — ${t.length} triggers`);
            if (t.includes('!elijah')) ok('!elijah present (typo !eljah is gone)');
            else bad('!elijah missing from roster');
            if (t.includes('!eljah')) bad('!eljah still in roster — old logger list leaked in');
            if (t.includes('!emergence')) ok('!emergence present');
            else warn('!emergence not on roster');
            const kindroid = ['!aria', '!aion', '!horizon', '!terra', '!vigil', '!riven', '!dominious', '!bane', '!serina', '!lumia']
                .filter((n) => t.includes(n));
            if (kindroid.length) ok(`Kindroid on roster: ${kindroid.join(' ')}`);
            else warn('no Kindroid names on roster');
        }
    } catch (e) {
        bad(`/roster failed: ${e.message}`);
    }

    try {
        const q = await getJson(`${HOST}/poll-web-queue`);
        if (q.status === 200 && Array.isArray(q.body?.messages)) {
            ok(`/poll-web-queue exists (${q.body.messages.length} queued)`);
        } else if (q.status === 404) {
            bad('/poll-web-queue 404 — Bridge userscript will silently fail');
        } else {
            warn(`/poll-web-queue HTTP ${q.status}`);
        }
    } catch (e) {
        warn(`/poll-web-queue: ${e.message}`);
    }
}

// ── 4. Telegram getMe (read-only) ───────────────────────────────────────────
console.log('\n── Telegram tokens ──');
for (const name of ['TELEGRAM_TOKEN', 'TELEGRAM_TOKEN2', 'TELEGRAM_TOKENX']) {
    if (!present(env[name])) continue;
    try {
        const r = await getJson(`https://api.telegram.org/bot${env[name]}/getMe`);
        if (r.body?.ok) ok(`${name}: @${r.body.result.username}`);
        else bad(`${name}: ${r.body?.description || 'getMe failed'}`);
    } catch (e) {
        bad(`${name}: ${e.message}`);
    }
}

// ── 5. Nomi list + room (read-only, no chat) ────────────────────────────────
console.log('\n── Nomi API ──');
if (present(env.NOMI_API_KEY)) {
    try {
        const r = await getJson('https://api.nomi.ai/v1/nomis', { Authorization: env.NOMI_API_KEY });
        const list = r.body?.nomis || [];
        if (!Array.isArray(list) || list.length === 0) {
            bad(`nomis list empty or bad (HTTP ${r.status})`);
        } else {
            ok(`NOMI_API_KEY valid — ${list.length} nomis`);
            const byUuid = new Map(list.map((n) => [n.uuid, n.name]));
            const uuidKeys = REQUIRED_ENV.filter((k) => k.startsWith('NOMI_UUID_'));
            let hits = 0;
            for (const k of uuidKeys) {
                const id = env[k];
                if (!id) continue;
                if (byUuid.has(id)) hits++;
                else bad(`${k} not on this account`);
            }
            if (hits === uuidKeys.filter((k) => present(env[k])).length) {
                ok(`all ${hits} env UUIDs match live nomis`);
            }
        }
    } catch (e) {
        bad(`Nomi list: ${e.message}`);
    }

    const east = env.NOMI_ROOM_ID_EAST || env.NOMI_ROOM_ID_KYROS;
    const west = env.NOMI_ROOM_ID_WEST || env.NOMI_ROOM_ID_COUPLE;
    const kinGroup = env.KINDROID_GROUP_ID || env.KINDROID_GROUP_ID_KYROS2;
    if (present(east)) {
        try {
            const r = await getJson(`https://api.nomi.ai/v1/rooms/${east}`, { Authorization: env.NOMI_API_KEY });
            if (r.status === 200) ok('East Wing room reachable');
            else bad(`East Wing HTTP ${r.status}`);
        } catch (e) {
            bad(`East Wing: ${e.message}`);
        }
    } else warn('NOMI_ROOM_ID_EAST (or KYROS alias) missing — node kyros_nomi_rooms.mjs');
    if (present(west)) {
        try {
            const r = await getJson(`https://api.nomi.ai/v1/rooms/${west}`, { Authorization: env.NOMI_API_KEY });
            if (r.status === 200) ok('West Wing room reachable');
            else bad(`West Wing HTTP ${r.status}`);
        } catch (e) {
            bad(`West Wing: ${e.message}`);
        }
    } else warn('NOMI_ROOM_ID_WEST missing — node kyros_nomi_rooms.mjs');
    if (present(kinGroup)) ok('Kindroid group id set (API ping skipped)');
    else warn('KINDROID_GROUP_ID missing — Kindroid room cues go to Bridge queue if the group API fails');
} else {
    warn('skipping Nomi API — no key');
}

console.log('\n── Kindroid ──');
if (present(env.KINDROID_API_KEY)) {
    ok('KINDROID_API_KEY present (no safe read endpoint — not pinged)');
} else {
    warn('KINDROID_API_KEY missing — Kindroid DMs will fail');
}

console.log(failed ? `\n❌ ${failed} check(s) failed\n` : '\n✅ doctor clear\n');
process.exit(failed ? 1 : 0);
