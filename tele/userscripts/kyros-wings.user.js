// ==UserScript==
// @name         Kyros Wings
// @namespace    kyros
// @version      1.0
// @description  One tab = one room (East / West / Kindroid). Polls the router and types schedule lines into the chat box. No Nomi/Kindroid room IDs.
// @match        https://nomi.ai/*
// @match        https://*.nomi.ai/*
// @match        https://kindroid.ai/*
// @match        https://*.kindroid.ai/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// ==/UserScript==

(function () {
    const HOSTS = ['http://127.0.0.1:8081', 'http://127.0.0.1:8080'];
    let HOST = HOSTS[0];
    let wing = sessionStorage.getItem('kyrosWing') || '';
    let chatEl = null;
    let sendEl = null;
    let teaching = null;

    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;background:#111;color:#eee;padding:8px;font:12px/1.4 sans-serif;border:1px solid #666;display:flex;gap:6px;flex-wrap:wrap;max-width:360px;align-items:center;';
    document.documentElement.appendChild(bar);

    function btn(label, fn) {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = 'cursor:pointer;background:#222;color:#eee;border:1px solid #555;padding:3px 7px;';
        b.onclick = fn;
        bar.appendChild(b);
        return b;
    }

    const status = document.createElement('span');
    status.style.flex = '1 1 100%';
    bar.appendChild(status);

    function paint() {
        status.textContent = wing
            ? `🏰 ${wing} → ${HOST}  box:${chatEl ? 'yes' : 'no'} send:${sendEl ? 'yes' : 'no'}`
            : '🏰 pick this window: East / West / Kindroid';
        [...bar.querySelectorAll('button')].forEach((b) => {
            b.style.borderColor = b.textContent.toLowerCase() === wing ? '#9f9' : '#555';
        });
    }

    function setWing(name) {
        wing = name;
        sessionStorage.setItem('kyrosWing', name);
        paint();
    }

    btn('East', () => setWing('east'));
    btn('West', () => setWing('west'));
    btn('Kindroid', () => setWing('kindroid'));
    btn('Teach box', () => {
        teaching = 'box';
        status.textContent = 'Click the chat text box…';
    });
    btn('Teach send', () => {
        teaching = 'send';
        status.textContent = 'Click the send button…';
    });

    document.addEventListener('click', (e) => {
        if (!teaching) return;
        e.preventDefault();
        e.stopPropagation();
        if (teaching === 'box') chatEl = e.target;
        if (teaching === 'send') sendEl = e.target;
        teaching = null;
        paint();
    }, true);

    function guessBox() {
        return document.querySelector('textarea')
            || document.querySelector('[contenteditable="true"]')
            || document.querySelector('[role="textbox"]');
    }

    function typeLine(text) {
        const el = chatEl && document.contains(chatEl) ? chatEl : guessBox();
        if (!el) {
            status.textContent = 'No chat box — click Teach box';
            return false;
        }
        chatEl = el;
        el.focus();
        if (el.isContentEditable) {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
        } else {
            const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) setter.call(el, text);
            else el.value = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (sendEl && document.contains(sendEl)) sendEl.click();
        else {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
        }
        return true;
    }

    function gm(opts) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...opts,
                onload: resolve,
                onerror: reject
            });
        });
    }

    async function pickHost() {
        for (const h of HOSTS) {
            try {
                const res = await gm({ method: 'GET', url: `${h}/roster` });
                if (res.status === 200 && String(res.responseText).includes('triggers')) {
                    HOST = h;
                    return;
                }
            } catch { /* try next */ }
        }
    }

    async function poll() {
        if (!wing) return;
        try {
            const res = await gm({ method: 'GET', url: `${HOST}/poll-web-queue?room=${encodeURIComponent(wing)}` });
            const body = JSON.parse(res.responseText || '{}');
            const lines = Array.isArray(body.messages) ? body.messages : [];
            for (const line of lines) {
                typeLine(line);
                await new Promise((r) => setTimeout(r, 800));
            }
            if (lines.length) paint();
        } catch {
            status.textContent = 'index2 not reachable on 8081/8080';
        }
    }

    pickHost().then(paint);
    setInterval(poll, 4000);
    paint();
})();
