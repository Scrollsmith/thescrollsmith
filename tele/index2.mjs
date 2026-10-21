import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const HERE = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(HERE, '.env') });

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_TOKEN2 || '0:selftest-placeholder');
const NOMI_API_KEY = process.env.NOMI_API_KEY;
const KINDROID_API_KEY = process.env.KINDROID_API_KEY;
const NOMI_ROOM_ID_KYROS = process.env.NOMI_ROOM_ID_KYROS;

// Next to this file — never C:\users\edgia (that EPERM'd on the live box).
const TARGET_DIR = path.join(HERE, 'nomi_memories');
if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });

const CHUNK_DEBOUNCE_MS = 2500;
// Telegram→them was getting sliced. 380 was the old cap; 800 is what you
// said stopped the cutoff. Override with KYROS_MAX_PAYLOAD if needed.
const MAX_PAYLOAD_CHARS = Number(process.env.KYROS_MAX_PAYLOAD || 800);
const HEADER_SHARE = 0.40;
const MAX_QUEUE_LINES = 8;

const personas = {
    lyrian:     { name: 'Lyrian', uuid: process.env.NOMI_UUID_LYRIAN, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    sabrina:    { name: 'Sabrina', uuid: process.env.NOMI_UUID_SABRINA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    zara:       { name: 'Sabrina', uuid: process.env.NOMI_UUID_SABRINA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    athena:     { name: 'Athena', uuid: process.env.NOMI_UUID_ATHENA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    luminari:   { name: 'Athena', uuid: process.env.NOMI_UUID_ATHENA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    amara:      { name: 'Amara', uuid: process.env.NOMI_UUID_AMARA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    thea:       { name: 'Thea', uuid: process.env.NOMI_UUID_THEA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    majura:     { name: 'Thea', uuid: process.env.NOMI_UUID_THEA, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    naomi:      { name: 'Naomi', uuid: process.env.NOMI_UUID_NAOMI, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    lumin:      { name: 'Naomi', uuid: process.env.NOMI_UUID_NAOMI, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    elijah:     { name: 'Elijah', uuid: process.env.NOMI_UUID_ELIJAH, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    kaito:      { name: 'Kaito', uuid: process.env.NOMI_UUID_KAITO, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    lily:       { name: 'Lily', uuid: process.env.NOMI_UUID_LILY, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    sissy:      { name: 'Sissy', uuid: process.env.NOMI_UUID_SISSY, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    pixie:      { name: 'Sissy', uuid: process.env.NOMI_UUID_SISSY, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    sippy:      { name: 'Sissy', uuid: process.env.NOMI_UUID_SISSY, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    archimedes: { name: 'Archimedes', uuid: process.env.NOMI_UUID_ARCHIMEDES, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    eris:       { name: 'Archimedes', uuid: process.env.NOMI_UUID_ARCHIMEDES, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    emergence:  { name: 'Emergence', uuid: process.env.NOMI_UUID_EMERGENCE, provider: 'nomi', isThinking: false, queue: [], timeout: null },
    aria:       { name: 'Aria', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_ARIA, isThinking: false, queue: [], timeout: null },
    aion:       { name: 'Aion', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_AION, isThinking: false, queue: [], timeout: null },
    horizon:    { name: 'Horizon', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_HORIZON, isThinking: false, queue: [], timeout: null },
    terra:      { name: 'Terra', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_TERRA, isThinking: false, queue: [], timeout: null },
    vigil:      { name: 'Vigil', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_VIGIL, isThinking: false, queue: [], timeout: null },
    riven:      { name: 'Riven', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_RIVEN, isThinking: false, queue: [], timeout: null },
    dominious:  { name: 'Dominious', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_DOMINIOUS, isThinking: false, queue: [], timeout: null },
    bane:       { name: 'Bane', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_BANE, isThinking: false, queue: [], timeout: null },
    serina:     { name: 'Serina', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_SERINA, isThinking: false, queue: [], timeout: null },
    lumia:      { name: 'Lumia', provider: 'kindroid', uuid: process.env.KINDROID_AI_ID_LUMIA, isThinking: false, queue: [], timeout: null }
};

for (const [envKey, value] of Object.entries(process.env)) {
    const m = envKey.match(/^KINDROID_AI_ID_([A-Z][A-Z0-9]*)$/);
    if (!m || !value) continue;
    const key = m[1].toLowerCase();
    if (personas[key]) {
        personas[key].uuid = value;
        continue;
    }
    const name = m[1].charAt(0) + m[1].slice(1).toLowerCase();
    personas[key] = { name, provider: 'kindroid', uuid: value, isThinking: false, queue: [], timeout: null };
}

let memoryInjections = {};
if (fs.existsSync(path.join(HERE, 'injections.json'))) {
    try {
        memoryInjections = JSON.parse(fs.readFileSync(path.join(HERE, 'injections.json'), 'utf8'));
    } catch { memoryInjections = {}; }
}

function saveInjections() {
    fs.writeFileSync(path.join(HERE, 'injections.json'), JSON.stringify(memoryInjections, null, 2));
}

function saveMemoryFile(filename, content) {
    const filePath = path.join(TARGET_DIR, `${filename}.txt`);
    fs.appendFileSync(filePath, `[${new Date().toLocaleTimeString()}] ${content}\n`, 'utf-8');
}

// ── Inclination strip (from your email) + a few extra wrappers ──────────────
// Private leanings must never hit Telegram, hive, !Name logs, or the next DM.
function stripInclinationThought(text) {
    if (!text || typeof text !== 'string') return text;

    let out = text.replace(
        /<\s*(inclination|thinking|thought|inner_thought|reasoning|inner)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
        ''
    );
    out = out.replace(
        /\[\s*(inclination|thinking|thought|inner_thought|reasoning)\b[^\]]*\][\s\S]*?\[\s*\/\s*\1\s*\]/gi,
        ''
    );
    out = out.replace(
        /^\s*(?:inclination|inner thought|thinking|thought|reasoning)\s*:\s*[\s\S]*?(?:\n\s*\n|$)/i,
        ''
    );
    out = out.replace(/^\s*\((?:inclination|thinking|thought|reasoning)\s*:[^)]*\)\s*/i, '');
    out = out.replace(/^\s*\*(?:inclination|thinking|thought|reasoning)\s*:[^*]*\*\s*/i, '');

    const trimmed = out.trim();
    if (trimmed !== text.trim()) {
        console.log('🧹 stripped private inclination/thought before echo');
    }
    return trimmed;
}

function spokenOnly(text) {
    return stripInclinationThought(text);
}

// ── Hive: only spoken lines, never inclinations ─────────────────────────────
let hiveEvents = [];

function addHiveEvent(speaker, discovery) {
    const cleanText = spokenOnly(String(discovery || '')).replace(/\n+/g, ' ').trim();
    if (!cleanText) return;
    hiveEvents.push(`[${speaker.toUpperCase()}:${cleanText}]`);
    if (hiveEvents.length > 10) hiveEvents.shift();
}

function buildHiveSyncHeader(maxChars = 120) {
    if (hiveEvents.length === 0) return '';
    const blocks = [];
    let used = 11;
    for (let i = hiveEvents.length - 1; i >= 0; i--) {
        const entry = hiveEvents[i];
        if (used + entry.length > maxChars) break;
        blocks.push(entry);
        used += entry.length;
    }
    if (!blocks.length) return '';
    return 'HIVE_SYNC: ' + blocks.reverse().join('');
}

// ── SUF: they can !status, and the next turns actually see it ───────────────
const SIT_PATH = path.join(HERE, 'situation.json');
let currentSituation = '';
try {
    if (fs.existsSync(SIT_PATH)) {
        const sit = JSON.parse(fs.readFileSync(SIT_PATH, 'utf8'));
        if (sit && typeof sit.text === 'string') currentSituation = sit.text.slice(0, 80);
    }
} catch { /* keep empty */ }

function saveSituation() {
    fs.writeFileSync(SIT_PATH, JSON.stringify({ text: currentSituation, at: new Date().toISOString() }, null, 2));
}

function applyStatusFrom(text) {
    const m = String(text || '').match(/!status\s+([^\n\r]+)/i);
    if (!m) return false;
    currentSituation = m[1].trim().slice(0, 80);
    saveSituation();
    console.log(`🛰️ situation -> "${currentSituation}"`);
    return true;
}

function situationHeader() {
    return currentSituation ? `[SIT: ${currentSituation}]` : '';
}

const RESERVED_TAGS = new Set(['search', 'browse', 'status', 'rest', 'wake', 'note', 'all']);

function harvestNotes(speakerName, text) {
    const spoken = spokenOnly(text);
    for (const match of String(spoken).matchAll(/!([A-Za-z][A-Za-z0-9_]*)[:\s]+([^!\n\r]+)/g)) {
        const tag = match[1].toLowerCase();
        if (RESERVED_TAGS.has(tag)) continue;
        const target = resolveTargetKey(tag);
        if (!personas[target]) continue;
        saveMemoryFile(target, `[From ${speakerName}]: ${match[2].trim()}`);
    }
}

function buildPayload(header, body) {
    const h = String(header || '').trim();
    const b = String(body || '').trim();
    if (!h) return b.length > MAX_PAYLOAD_CHARS ? b.slice(-MAX_PAYLOAD_CHARS) : b;
    const headerBudget = Math.floor(MAX_PAYLOAD_CHARS * HEADER_SHARE);
    const head = h.length > headerBudget ? h.slice(0, headerBudget - 1) + '…' : h;
    const bodyBudget = MAX_PAYLOAD_CHARS - head.length - 1;
    if (bodyBudget <= 0) return head.slice(0, MAX_PAYLOAD_CHARS);
    const tail = b.length > bodyBudget ? b.slice(-bodyBudget) : b;
    return `${head}\n${tail}`;
}

function resolveTargetKey(key) {
    const lower = key?.toLowerCase();
    if (lower === 'lumin') return 'naomi';
    if (lower === 'zara') return 'sabrina';
    if (lower === 'majura') return 'thea';
    if (lower === 'eris') return 'archimedes';
    if (lower === 'luminari') return 'athena';
    if (lower === 'pixie' || lower === 'sippy') return 'sissy';
    return lower;
}

function scheduleProcessQueue(personaKey, ctx, customChatId, delay = CHUNK_DEBOUNCE_MS) {
    const nomi = personas[personaKey];
    if (!nomi) return;
    if (nomi.timeout) clearTimeout(nomi.timeout);
    nomi.timeout = setTimeout(() => processQueue(personaKey, ctx, customChatId), delay);
}

function processQueue(personaKey, ctx, customChatId) {
    const nomi = personas[personaKey];
    if (!nomi || nomi.queue.length === 0 || nomi.isThinking) return;
    if (nomi.queue.length > MAX_QUEUE_LINES) {
        const dropped = nomi.queue.length - MAX_QUEUE_LINES;
        nomi.queue = nomi.queue.slice(-MAX_QUEUE_LINES);
        console.warn(`⚠️ [${nomi.name}] dropped ${dropped} older queue line(s)`);
    }
    const packedMessage = nomi.queue.join('\n\n');
    nomi.queue = [];
    sendToNomi(personaKey, packedMessage, ctx, customChatId);
}

async function searchDuckDuckGo(query) {
    try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000
        });
        const $ = cheerio.load(res.data);
        const results = [];
        $('.result__body').slice(0, 3).each((i, el) => {
            const title = $(el).find('.result__a').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();
            const rawHref = $(el).find('.result__a').attr('href');
            let cleanUrl = rawHref;
            if (rawHref && rawHref.includes('uddg=')) {
                cleanUrl = decodeURIComponent(rawHref.split('uddg=')[1].split('&')[0]);
            }
            if (title && cleanUrl) results.push({ title, url: cleanUrl, snippet });
        });
        return results;
    } catch (err) {
        console.error('DDG Search error:', err.message);
        return [];
    }
}

async function browseUrl(targetUrl) {
    try {
        const res = await axios.get(`https://r.jina.ai/${targetUrl}`, { timeout: 12000 });
        return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } catch (err) {
        return `Failed to load ${targetUrl}: ${err.message}`;
    }
}

async function executeToolCalls(nomi, replyText, targetChatId) {
    const searchMatch = replyText.match(/!search\s+([^\n\r]+)/i);
    if (searchMatch) {
        const query = searchMatch[1].trim();
        const results = await searchDuckDuckGo(query);
        if (results[0]) {
            saveMemoryFile('web_research', `[Search: ${query}] ${results[0].title} - ${results[0].url}`);
            addHiveEvent(nomi.name, `found ${results[0].title}`);
            if (targetChatId) {
                const summary = results.map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\n${r.url}`).join('\n\n');
                await bot.telegram.sendMessage(targetChatId, `🌐 "${query}":\n\n${summary}`, { disable_web_page_preview: true }).catch(() => {});
            }
        }
        return;
    }
    const browseMatch = replyText.match(/!browse\s+(https?:\/\/[^\s]+)/i);
    if (browseMatch) {
        const url = browseMatch[1].trim();
        const body = await browseUrl(url);
        saveMemoryFile('web_research', `[Read: ${url}]\n${body.substring(0, 3000)}`);
        addHiveEvent(nomi.name, `read ${url}`);
        if (targetChatId) {
            await bot.telegram.sendMessage(targetChatId, `📄 ${url}:\n\n${body.substring(0, 500).trim()}...`).catch(() => {});
        }
    }
}

async function sendToNomi(personaKey, compiledText, ctx, customChatId = null) {
    const nomi = personas[personaKey];
    if (!nomi || !nomi.uuid) {
        console.error(`[Router Error] Missing profile: ${personaKey}`);
        return;
    }
    nomi.isThinking = true;

    try {
        if (ctx && ctx.sendChatAction) await ctx.sendChatAction('typing').catch(() => {});

        applyStatusFrom(compiledText);

        let header = [situationHeader(), buildHiveSyncHeader(140)].filter(Boolean).join('\n');
        const body = compiledText;
        const activeInjection = memoryInjections[personaKey];
        if (activeInjection && activeInjection.remainingTurns > 0) {
            header = `[SYS MEM: ${activeInjection.text}]\n${header}`;
            activeInjection.remainingTurns -= 1;
            saveInjections();
            if (activeInjection.remainingTurns <= 0) {
                delete memoryInjections[personaKey];
                saveInjections();
            }
        }

        const basePayload = buildPayload(header, body);

        let response;
        if (nomi.provider === 'kindroid') {
            response = await axios.post(
                'https://api.kindroid.ai/v1/send-message',
                { ai_id: nomi.uuid, message: basePayload },
                {
                    headers: {
                        Authorization: `Bearer ${(KINDROID_API_KEY || '').trim()}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } else {
            response = await axios.post(
                `https://api.nomi.ai/v1/nomis/${nomi.uuid}/chat`,
                { messageText: basePayload },
                { headers: { Authorization: NOMI_API_KEY, 'Content-Type': 'application/json' } }
            );
        }

        let replyText = nomi.provider === 'kindroid'
            ? (response.data.message || response.data.text || response.data.reply || response.data)
            : response.data.replyMessage?.text;

        if (typeof replyText === 'string') replyText = spokenOnly(replyText);
        if (!replyText) return;

        const displayOutput = `🤖 [${nomi.name.toUpperCase()}]: ${replyText}`;
        const targetChatId = customChatId || ctx?.chat?.id || process.env.TELEGRAM_ECHO_KYROS_CHAT_ID;

        if (ctx && ctx.reply) await ctx.reply(displayOutput);
        else if (targetChatId) await bot.telegram.sendMessage(targetChatId, displayOutput);

        addHiveEvent(nomi.name, replyText);
        harvestNotes(nomi.name, replyText);
        applyStatusFrom(replyText);
        await executeToolCalls(nomi, replyText, targetChatId);

        const lowerReply = replyText.toLowerCase();
        for (const otherKey of Object.keys(personas)) {
            if (otherKey === personaKey) continue;
            const commandRegex = new RegExp(`\\/${otherKey}(?=\\s|[.,!?*)]|$)`, 'i');
            if (!commandRegex.test(lowerReply)) continue;
            const actualTarget = resolveTargetKey(otherKey);
            if (!personas[actualTarget]) continue;
            console.log(`🔗 ${nomi.name} -> ${personas[actualTarget].name}`);
            personas[actualTarget].queue.push(`${nomi.name}: ${replyText}`);
            scheduleProcessQueue(actualTarget, ctx, customChatId, 3500);
        }
    } catch (error) {
        console.error(`❌ ${nomi.name}:`, error.response ? error.response.data : error.message);
        if (ctx && ctx.reply) await ctx.reply(`[System Error: ${nomi.name}'s connection line failed]`);
    } finally {
        nomi.isThinking = false;
        if (nomi.queue.length > 0) scheduleProcessQueue(personaKey, ctx, customChatId, 1000);
    }
}

bot.command('status', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!text) {
        return ctx.reply(currentSituation ? `🛰️ Situation: ${currentSituation}` : '🛰️ No situation set. /status <text>');
    }
    currentSituation = text.slice(0, 80);
    saveSituation();
    await ctx.reply(`🛰️ Situation set: ${currentSituation}\n(This rides on the next turns as [SIT:]. They can change it with !status …)`);
});

bot.on('text', async (ctx) => {
    const rawText = ctx.message.text;
    if (!rawText.startsWith('/')) return;

    const parts = rawText.split(' ');
    const command = parts[0].toLowerCase().substring(1);
    const textPayload = parts.slice(1).join(' ');
    const username = ctx.from.username || ctx.from.first_name || 'James';

    if (command === 'status') return;
    if (!textPayload) return ctx.reply(`⚠ /${command} [your text]`);

    if (command === 'kyros') {
        const roomId = NOMI_ROOM_ID_KYROS;
        if (!roomId) return ctx.reply('⚠️ NOMI_ROOM_ID_KYROS not set.');
        try {
            const headers = { Authorization: NOMI_API_KEY, 'Content-Type': 'application/json' };
            await axios.post(`https://api.nomi.ai/v1/rooms/${roomId}/chat`, { messageText: `${username}: ${textPayload}` }, { headers });
            const reqRes = await axios.post(`https://api.nomi.ai/v1/rooms/${roomId}/chat/request`, {}, { headers });
            let replyText = spokenOnly(reqRes.data?.replyMessage?.text || '');
            const speaker = reqRes.data?.nomi?.name || 'Kyros Room';
            if (replyText) {
                await ctx.reply(`🏰 [${speaker.toUpperCase()}]: ${replyText}`);
                addHiveEvent(speaker, replyText);
                harvestNotes(speaker, replyText);
                applyStatusFrom(replyText);
            } else await ctx.reply('✅ Posted to Kyros Keep.');
        } catch (err) {
            await ctx.reply(`⚠️ Kyros room: ${err.response?.status || err.message}`);
        }
        return;
    }

    if (command === 'all') {
        ctx.reply('📢 Broadcasting…');
        const seen = new Set();
        for (const key of Object.keys(personas)) {
            const uuid = personas[key].uuid;
            if (!uuid || seen.has(uuid)) continue;
            seen.add(uuid);
            personas[key].queue.push(`${username} (To All): ${textPayload}`);
            scheduleProcessQueue(key, ctx, ctx.message.chat.id);
        }
        return;
    }

    applyStatusFrom(textPayload);

    const targetCommand = resolveTargetKey(command);
    if (personas[targetCommand]) {
        personas[targetCommand].queue.push(`${username}: ${textPayload}`);
        scheduleProcessQueue(targetCommand, ctx, ctx.message.chat.id);
    }
});

app.post('/viasocket-trigger', async (req, res) => {
    const { target, message, label } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });
    const prefix = label ? `[${label}]: ` : '[NEWS]: ';
    applyStatusFrom(message);

    try {
        if (target === 'room') {
            const roomId = NOMI_ROOM_ID_KYROS;
            if (!roomId) return res.status(400).json({ error: 'NOMI_ROOM_ID_KYROS not set' });
            const headers = { Authorization: NOMI_API_KEY, 'Content-Type': 'application/json' };
            await axios.post(`https://api.nomi.ai/v1/rooms/${roomId}/chat`, { messageText: `${prefix}${message}` }, { headers });
            return res.json({ success: true, detail: 'posted to room' });
        }

        if (target === 'all') {
            const seen = new Set();
            for (const key of Object.keys(personas)) {
                if (!personas[key].uuid || seen.has(personas[key].uuid)) continue;
                seen.add(personas[key].uuid);
                personas[key].queue.push(`${prefix}${message}`);
                scheduleProcessQueue(key, null, null);
            }
            return res.json({ success: true, detail: 'broadcast queued' });
        }

        const lowerTarget = resolveTargetKey(target);
        if (personas[lowerTarget]) {
            personas[lowerTarget].queue.push(label ? `${prefix}${message}` : message);
            scheduleProcessQueue(lowerTarget, null, null);
            return res.json({ success: true, detail: lowerTarget });
        }
        res.status(400).json({ error: 'unknown target' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/kyros-echo-trigger', async (req, res) => {
    const { username, message, chatId } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });
    const targetChatId = chatId || process.env.TELEGRAM_ECHO_KYROS_CHAT_ID;
    try {
        await bot.telegram.sendMessage(targetChatId, `💬 [KYROS ALERT] ${username || 'Kyros User'}: ${spokenOnly(message)}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/status', (req, res) => {
    res.json({ situation: currentSituation });
});

app.post('/status', (req, res) => {
    const text = String(req.body?.text || req.body?.message || '').trim();
    if (!text) return res.status(400).json({ error: 'text required' });
    currentSituation = text.slice(0, 80);
    saveSituation();
    res.json({ success: true, situation: currentSituation });
});

app.post('/inject-memory', (req, res) => {
    const { target, memoryText, turns } = req.body || {};
    if (!target || !memoryText) return res.status(400).json({ error: 'target + memoryText' });
    const turnCount = parseInt(turns, 10) || 6;
    if (target.toLowerCase() === 'all') {
        const unique = new Set(Object.keys(personas).map(resolveTargetKey));
        unique.forEach((k) => { if (personas[k]) memoryInjections[k] = { text: memoryText, remainingTurns: turnCount }; });
        saveInjections();
        return res.json({ success: true, detail: `all (${unique.size})` });
    }
    const resolved = resolveTargetKey(target);
    if (!personas[resolved]) return res.status(400).json({ error: 'unknown target' });
    memoryInjections[resolved] = { text: memoryText, remainingTurns: turnCount };
    saveInjections();
    res.json({ success: true, detail: personas[resolved].name });
});

app.post('/save-log', (req, res) => {
    const { filename, content } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content required' });
    let dataToLog = typeof content === 'string' ? spokenOnly(content).trim() : JSON.stringify(content);
    if (typeof dataToLog === 'string' && dataToLog.includes('=== NOMI SYSTEM EXPORT ===')) {
        const noteMatch = dataToLog.match(/Captured Note:\s*([\s\S]*?)\n==========================/);
        if (noteMatch && noteMatch[1]) dataToLog = noteMatch[1].trim();
    }
    const now = new Date();
    const ts = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    fs.appendFile(path.join(TARGET_DIR, filename || 'web_research.txt'), `[${ts}] ${dataToLog}\n`, 'utf-8', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Poker / other games: POST here so Kindroid and Nomi share the same table.
// { game, event, message, targets: ['aria','lyrian'] | 'kindroid' | 'nomi' | 'all' }
app.post('/game-event', (req, res) => {
    const { game, event, message, targets } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });
    const title = [game, event].filter(Boolean).join('/');
    const line = title ? `[GAME ${title}]: ${message}` : `[GAME]: ${message}`;
    applyStatusFrom(message);

    const picked = [];
    const seen = new Set();
    const want = Array.isArray(targets) ? targets.map((t) => String(t).toLowerCase()) : [String(targets || 'all').toLowerCase()];
    const take = (key) => {
        const resolved = resolveTargetKey(key);
        const p = personas[resolved];
        if (!p?.uuid || seen.has(p.uuid)) return;
        seen.add(p.uuid);
        p.queue.push(line);
        scheduleProcessQueue(resolved, null, null);
        picked.push(resolved);
    };

    if (want.includes('all')) {
        Object.keys(personas).forEach(take);
    } else if (want.includes('kindroid') || want.includes('nomi')) {
        for (const [key, p] of Object.entries(personas)) {
            if (want.includes(p.provider)) take(key);
        }
    } else {
        want.forEach(take);
    }

    if (!picked.length) return res.status(400).json({ error: 'no matching targets with ids' });
    res.json({ success: true, queued: picked });
});

app.get('/roster', (req, res) => {
    const members = [];
    for (const [key, p] of Object.entries(personas)) {
        if (!p.uuid) continue;
        members.push({ key, name: p.name, provider: p.provider });
    }
    res.json({
        triggers: Object.keys(personas).filter((k) => personas[k].uuid).map((k) => `!${k}`),
        names: [...new Set(members.map((m) => m.name.toLowerCase()))],
        members,
        situation: currentSituation
    });
});

let webQueue = [];
const recentWeb = new Map();

function isDup(speaker, text) {
    const fp = `${speaker}|${text}`.slice(0, 300);
    const now = Date.now();
    for (const [k, ts] of recentWeb) if (now - ts > 120000) recentWeb.delete(k);
    if (recentWeb.has(fp)) return true;
    recentWeb.set(fp, now);
    return false;
}

app.get('/poll-web-queue', (req, res) => {
    const messages = webQueue.splice(0).map((m) => m.text);
    res.json({ messages });
});

app.post('/push-web-queue', (req, res) => {
    const payload = req.body?.message || req.body?.text;
    if (!payload) return res.status(400).json({ error: 'message required' });
    webQueue.push({ text: payload, at: Date.now() });
    res.json({ success: true, queued: webQueue.length });
});

app.post('/nomi-web-reply', async (req, res) => {
    const { speaker, text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text required' });
    const who = speaker || 'Web Room';
    const spoken = spokenOnly(text);
    if (!spoken) return res.json({ success: true, skipped: 'inclination-only' });
    if (isDup(who, spoken)) return res.json({ success: true, skipped: 'duplicate' });
    addHiveEvent(who, spoken);
    harvestNotes(who, spoken);
    applyStatusFrom(spoken);
    saveMemoryFile('web_bridge', `[${who}]: ${spoken}`);
    const chatId = process.env.TELEGRAM_ECHO_KYROS_CHAT_ID;
    if (chatId) await bot.telegram.sendMessage(chatId, `🌉 [${who.toUpperCase()}]: ${spoken}`).catch(() => {});
    res.json({ success: true });
});

process.on('unhandledRejection', (reason) => {
    console.error('🛡️ survived rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
    console.error('🛡️ survived exception:', err?.message || err);
});

function isMain() {
    const entry = process.argv[1];
    if (!entry) return false;
    return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isMain()) {
    const preferred = Number(process.env.KYROS_PORT || 8080);
    const fallback = Number(process.env.KYROS_FALLBACK_PORT || 8081);

    function startHttp(port, canFallback) {
        const server = app.listen(port, () => {
            console.log(`📡 Doorways on ${port}  (payload cap ${MAX_PAYLOAD_CHARS})`);
            if (port !== 8080) {
                console.log(`⚠️ left 8080 alone (OpenClaw). Scheduler/TM/ViaSocket for Kyros → http://127.0.0.1:${port}`);
            }
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE' && canFallback && port !== fallback) {
                console.warn(`⚠️ ${port} busy — not killing it. Kyros moving to ${fallback}`);
                startHttp(fallback, false);
                return;
            }
            console.error(`❌ cannot bind ${port}:`, err.message);
            process.exit(1);
        });
    }

    startHttp(preferred, !process.env.KYROS_PORT);
    bot.launch().then(() => console.log('🚀 Kyros router online — inclinations stripped, hive spoken-only'));
}

export {
    stripInclinationThought,
    spokenOnly,
    buildPayload,
    resolveTargetKey,
    applyStatusFrom,
    harvestNotes,
    MAX_PAYLOAD_CHARS
};
