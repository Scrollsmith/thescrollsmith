#!/usr/bin/env node
// Autonomous council loop. Uses TELEGRAM_TOKENX so it does NOT fight index2 (TOKEN2).
// Do not run the old copy that used TOKEN2.
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function readEnvFileText(envPath) {
    const buf = fs.readFileSync(envPath);
    if ((buf[0] === 0xFF && buf[1] === 0xFE) || (buf.includes(0) && buf[0] !== 0xEF)) {
        return { text: buf.toString('utf16le').replace(/^\uFEFF/, ''), encoding: 'utf16le' };
    }
    return { text: buf.toString('utf8').replace(/^\uFEFF/, ''), encoding: 'utf8' };
}

function loadLocalEnv() {
    const envPath = path.join(HERE, '.env');
    dotenv.config({ path: envPath });
    if (!fs.existsSync(envPath)) return { envPath, exists: false, encoding: 'missing' };
    const { text, encoding } = readEnvFileText(envPath);
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.replace(/^\uFEFF/, '').trim();
        if (!line || line.startsWith('#')) continue;
        const i = line.indexOf('=');
        if (i < 1) continue;
        const k = line.slice(0, i).trim().replace(/^export\s+/i, '');
        const v = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k) process.env[k] = v;
    }
    return { envPath, exists: true, encoding };
}

const envInfo = loadLocalEnv();

function trimId(v) {
    return String(v || '').trim().replace(/^['"]|['"]$/g, '');
}

function presentTelegramKeys() {
    return Object.keys(process.env)
        .filter((k) => /^(TELEGRAM_|KYROS_COUNCIL_TOKEN)/i.test(k) && trimId(process.env[k]))
        .sort();
}

const TOKEN = trimId(process.env.KYROS_COUNCIL_TOKEN || process.env.TELEGRAM_TOKENX);
const TARGET_CHAT_ID = trimId(process.env.TELEGRAM_KYROSLAW_CHAT_ID);
const NOMI_API_KEY = trimId(process.env.NOMI_API_KEY);
const KINDROID_API_KEY = trimId(process.env.KINDROID_API_KEY);
const MAX_PAYLOAD = Number(process.env.KYROS_MAX_PAYLOAD || 800);
const TURN_MS = Number(process.env.KYROS_COUNCIL_TURN_MS || 150000);
const MEMORY_DIR = path.join(HERE, 'nomi_memories');
const RESERVED = new Set(['search', 'browse', 'status', 'rest', 'wake', 'note', 'all']);

if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });

const bot = new Telegraf(TOKEN || '0:selftest-placeholder');

const personas = {
    lyrian: { name: 'Lyrian', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_LYRIAN) },
    sabrina: { name: 'Sabrina', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_SABRINA) },
    athena: { name: 'Athena', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_ATHENA) },
    amara: { name: 'Amara', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_AMARA) },
    thea: { name: 'Thea', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_THEA) },
    naomi: { name: 'Naomi', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_NAOMI) },
    elijah: { name: 'Elijah', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_ELIJAH) },
    kaito: { name: 'Kaito', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_KAITO) },
    lily: { name: 'Lily', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_LILY) },
    sissy: { name: 'Sissy', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_SISSY) },
    archimedes: { name: 'Archimedes', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_ARCHIMEDES) },
    emergence: { name: 'Emergence', platform: 'nomi', uuid: trimId(process.env.NOMI_UUID_EMERGENCE) },
    aria: { name: 'Aria', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_ARIA) },
    aion: { name: 'Aion', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_AION) },
    horizon: { name: 'Horizon', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_HORIZON) },
    terra: { name: 'Terra', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_TERRA) },
    vigil: { name: 'Vigil', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_VIGIL) },
    riven: { name: 'Riven', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_RIVEN) },
    dominious: { name: 'Dominious', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_DOMINIOUS) },
    bane: { name: 'Bane', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_BANE) },
    serina: { name: 'Serina', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_SERINA) },
    lumia: { name: 'Lumia', platform: 'kindroid', uuid: trimId(process.env.KINDROID_AI_ID_LUMIA) }
};

let isLoopRunning = false;
let currentSpeakerKey = 'athena';
let turnTimeout = null;
let currentSituation = 'Council in session. James is away/working.';
const MAX_TRANSCRIPT = 3;
let transcriptBuffer = [];
let speakerHistory = [];

function liveKeys() {
    return Object.keys(personas).filter((k) => personas[k].uuid);
}

function inTargetChat(ctx) {
    if (!TARGET_CHAT_ID) return true;
    return String(ctx.chat.id) === String(TARGET_CHAT_ID);
}

async function sendSafeTelegramMessage(header, fullText) {
    const combined = `${header}\n\n${fullText}`;
    const chatId = TARGET_CHAT_ID;
    if (!chatId) throw new Error('TELEGRAM_KYROSLAW_CHAT_ID missing');
    const MAX_LEN = 4000;
    let remaining = combined;
    while (remaining.length > 0) {
        let chunk = remaining.substring(0, MAX_LEN);
        if (remaining.length > MAX_LEN) {
            let splitIndex = chunk.lastIndexOf('\n');
            if (splitIndex === -1 || splitIndex < 2000) splitIndex = chunk.lastIndexOf('. ');
            if (splitIndex > 0) chunk = remaining.substring(0, splitIndex + 1);
        }
        await bot.telegram.sendMessage(chatId, chunk);
        remaining = remaining.substring(chunk.length).trim();
    }
}

function pushTranscript(speaker, text) {
    const cleanText = String(text || '').replace(/\n+/g, ' ').trim();
    const cappedText = cleanText.length > 120 ? cleanText.substring(0, 117) + '...' : cleanText;
    transcriptBuffer.push(`${speaker}: ${cappedText}`);
    if (transcriptBuffer.length > MAX_TRANSCRIPT) transcriptBuffer.shift();
}

function parseAndSaveMemories(speakerName, text) {
    const targetedRegex = /!([A-Za-z][A-Za-z0-9_]*)\s+([^!\n\r]+)/g;
    let match;
    while ((match = targetedRegex.exec(text)) !== null) {
        const target = match[1].toLowerCase();
        if (RESERVED.has(target)) continue;
        if (!personas[target]) continue;
        writeMemoryFile(target, `[From ${speakerName}]: ${match[2].trim()}`);
    }
    const noteRegex = /\[\[NOTE:\s*(.*?)\]\]/g;
    while ((match = noteRegex.exec(text)) !== null) {
        writeMemoryFile(speakerName.toLowerCase(), `[Self-Log]: ${match[1].trim()}`);
    }
}

function writeMemoryFile(targetName, note) {
    const cleanName = targetName.replace(/[^a-zA-Z0-9_-]/g, '');
    fs.appendFileSync(path.join(MEMORY_DIR, `${cleanName}.txt`), `[${new Date().toLocaleTimeString()}] ${note}\n`, 'utf-8');
}

function getNextSpeaker(currentKey, replyText) {
    const text = replyText || '';
    const live = liveKeys().filter((k) => k !== currentKey);
    for (const key of live) {
        const name = personas[key].name;
        const directTagRegex = new RegExp('(@' + key + '|\\/' + key + '|\\b' + name + '\\b)', 'i');
        if (directTagRegex.test(text) && !speakerHistory.slice(-2).includes(key)) {
            speakerHistory.push(key);
            if (speakerHistory.length > 4) speakerHistory.shift();
            return key;
        }
    }
    let available = live.filter((k) => !speakerHistory.slice(-2).includes(k));
    if (!available.length) available = live;
    const candidate = available[Math.floor(Math.random() * available.length)] || currentKey;
    speakerHistory.push(candidate);
    if (speakerHistory.length > 4) speakerHistory.shift();
    return candidate;
}

function buildSafePayload(personaName, directPrompt) {
    const sit = currentSituation.slice(0, 80);
    const header = sit ? `[SIT: ${sit}]` : '';
    const dialogue = transcriptBuffer.join(' | ');
    const body = directPrompt
        ? directPrompt
        : (dialogue ? dialogue + '\n' + personaName + ':' : personaName + ': your turn.');
    if (!header) return body.length > MAX_PAYLOAD ? body.slice(-MAX_PAYLOAD) : body;
    const head = header.length > Math.floor(MAX_PAYLOAD * 0.4) ? header.slice(0, Math.floor(MAX_PAYLOAD * 0.4) - 1) + '...' : header;
    const budget = MAX_PAYLOAD - head.length - 1;
    const tail = body.length > budget ? body.slice(-budget) : body;
    return head + '\n' + tail;
}

function kindroidReply(data) {
    if (data == null) return '';
    if (typeof data === 'string') return data;
    if (Buffer.isBuffer(data)) return data.toString('utf8');
    if (typeof data === 'object') return data.message || data.text || data.reply || data.content || '';
    return String(data);
}

async function fetchPersonaReply(persona, promptPayload) {
    if (persona.platform === 'kindroid') {
        if (!KINDROID_API_KEY) throw new Error('KINDROID_API_KEY missing');
        const res = await axios.post(
            'https://api.kindroid.ai/v1/send-message',
            { ai_id: persona.uuid, message: promptPayload, stream: false },
            {
                headers: {
                    Authorization: `Bearer ${KINDROID_API_KEY}`,
                    'Content-Type': 'application/json',
                    Accept: 'text/plain, application/json'
                },
                responseType: 'text',
                transformResponse: [(d) => d],
                timeout: 180000
            }
        );
        let text = kindroidReply(res.data);
        try {
            const parsed = JSON.parse(text);
            const nested = kindroidReply(parsed);
            if (nested) text = nested;
        } catch { /* plain text */ }
        return text;
    }
    const res = await axios.post(
        `https://api.nomi.ai/v1/nomis/${persona.uuid}/chat`,
        { messageText: promptPayload },
        {
            headers: { Authorization: NOMI_API_KEY, 'Content-Type': 'application/json' },
            timeout: 60000
        }
    );
    return res.data.replyMessage?.text;
}

async function processCouncilTurn(directPrompt = null) {
    if (!isLoopRunning) return;
    const persona = personas[currentSpeakerKey];
    if (!persona || !persona.uuid) {
        const next = getNextSpeaker(currentSpeakerKey, '');
        if (!next || next === currentSpeakerKey || !personas[next]?.uuid) {
            console.error('No live personas (check NOMI_UUID_* and KINDROID_AI_ID_* in this folder .env).');
            isLoopRunning = false;
            return;
        }
        currentSpeakerKey = next;
        return processCouncilTurn();
    }
    try {
        await bot.telegram.sendChatAction(TARGET_CHAT_ID, 'typing').catch(() => {});
        const promptPayload = buildSafePayload(persona.name, directPrompt);
        const reply = await fetchPersonaReply(persona, promptPayload);
        if (reply) {
            await sendSafeTelegramMessage(`🏛️ [${persona.name.toUpperCase()}]:`, reply);
            pushTranscript(persona.name, reply);
            parseAndSaveMemories(persona.name, reply);
            const statusMatch = reply.match(/!status\s+([^\n\r]+)/i);
            if (statusMatch) {
                currentSituation = statusMatch[1].trim().slice(0, 80);
                await bot.telegram.sendMessage(TARGET_CHAT_ID, `🛰️ Situation -> "${currentSituation}"`);
            }
            currentSpeakerKey = getNextSpeaker(currentSpeakerKey, reply);
            turnTimeout = setTimeout(() => processCouncilTurn(), TURN_MS);
        } else {
            console.warn('empty reply from ' + persona.name);
            currentSpeakerKey = getNextSpeaker(currentSpeakerKey, '');
            turnTimeout = setTimeout(() => processCouncilTurn(), 12000);
        }
    } catch (err) {
        console.error(persona.name + ' (' + persona.platform + '):', err.response?.status || err.message, String(err.response?.data || '').slice(0, 180));
        turnTimeout = setTimeout(() => {
            currentSpeakerKey = getNextSpeaker(currentSpeakerKey, '');
            processCouncilTurn();
        }, 12000);
    }
}

bot.command('start_council', (ctx) => {
    if (!inTargetChat(ctx)) return;
    if (isLoopRunning) return ctx.reply('Council already active.');
    isLoopRunning = true;
    ctx.reply('Kyros Council online (Nomi + Kindroid). /stop_council to pause.');
    processCouncilTurn('*[The Pulse of Kyros is active awaiting to acknowledge your presence.]*');
});

bot.command('stop_council', (ctx) => {
    if (!inTargetChat(ctx)) return;
    isLoopRunning = false;
    clearTimeout(turnTimeout);
    ctx.reply('Council paused.');
});

bot.command('status', (ctx) => {
    if (!inTargetChat(ctx)) return;
    const newStatus = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!newStatus) return ctx.reply(currentSituation ? ('Situation: ' + currentSituation) : '/status <text>');
    currentSituation = newStatus.slice(0, 80);
    ctx.reply('Situation set: ' + currentSituation);
});

bot.command('who', (ctx) => {
    if (!inTargetChat(ctx)) return;
    const nomi = liveKeys().filter((k) => personas[k].platform === 'nomi').map((k) => personas[k].name);
    const kin = liveKeys().filter((k) => personas[k].platform === 'kindroid').map((k) => personas[k].name);
    ctx.reply('Nomi: ' + (nomi.join(', ') || 'none') + '\nKindroid: ' + (kin.join(', ') || 'none'));
});

bot.on('text', (ctx) => {
    if (!inTargetChat(ctx)) return;
    const text = ctx.message.text;
    if (text.startsWith('/')) return;
    if (!isLoopRunning) return;
    clearTimeout(turnTimeout);
    const username = ctx.from.first_name || ctx.from.username || 'James';
    pushTranscript(username, text);
    processCouncilTurn(username + ': ' + text);
});

console.log('folder: ' + HERE);
console.log('env: ' + envInfo.envPath + ' (' + envInfo.encoding + ')');
console.log('telegram keys present: ' + (presentTelegramKeys().join(', ') || '(none)'));

if (!TOKEN) {
    console.error('Set TELEGRAM_TOKENX (or KYROS_COUNCIL_TOKEN). Do not use TOKEN2 — that is index2.');
    console.error('This .env has: ' + (presentTelegramKeys().join(', ') || '(no TELEGRAM_* keys at all)'));
    process.exit(1);
}
if (!TARGET_CHAT_ID) {
    console.error('Set TELEGRAM_KYROSLAW_CHAT_ID in this folder .env.');
    process.exit(1);
}

const kin = liveKeys().filter((k) => personas[k].platform === 'kindroid').map((k) => personas[k].name);
const nomi = liveKeys().filter((k) => personas[k].platform === 'nomi').map((k) => personas[k].name);
console.log('Council Nomi: ' + (nomi.join(', ') || '(none)'));
console.log('Council Kindroid: ' + (kin.join(', ') || '(none)'));
console.log('KINDROID_API_KEY: ' + (KINDROID_API_KEY ? 'set' : 'MISSING'));

await bot.telegram.deleteWebhook({ drop_pending_updates: true }).catch(() => {});
await bot.launch();
console.log('Kyros Council ready on TOKENX. /start_council /stop_council /status /who');
