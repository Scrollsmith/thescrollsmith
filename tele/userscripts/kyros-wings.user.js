// ==UserScript==
// @name         Kyros Wings
// @namespace    kyros
// @version      1.2
// @description  One tab = one room. Types schedule/[SIT:] from index2. Also POSTs !status so SUF actually hits the router.
// @match        https://nomi.ai/*
// @match        https://*.nomi.ai/*
// @match        https://kindroid.ai/*
// @match        https://*.kindroid.ai/*
// @match        http://nomi.ai/*
// @match        http://*.nomi.ai/*
// @match        http://kindroid.ai/*
// @match        http://*.kindroid.ai/*
// @run-at       document-idle
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
    let lastSuf = '';
    const seenStatus = new WeakSet();

    const bar = document.createElement('div');
    bar.id = 'kyros-wings-bar';
    bar.style.cssText = [
        'position:fixed',
        'top:8px',
        'right:8px',
        'z-index:2147483647',
        'background:#111',
        'color:#eee',
        'padding:8px',
        'font:13px/1.4 sans-serif',
        'border:2px solid #9f9',
        'display:flex',
        'gap:6px',
        'flex-wrap:wrap',
        'max-width:420px',
        'align-items:center',
        'pointer-events:auto'
    ].join(';');

    function hold(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }

    function btn(label, fn) {
        const b = document.createElement('div');
        b.textContent = label;
        b.setAttribute('data-kyros-btn', label);
        b.style.cssText = 'cursor:pointer;background:#222;color:#eee;border:1px solid #555;padding:6px 10px;user-select:none;';
        b.addEventListener('pointerdown', function (e) {
            hold(e);
            fn();
        }, true);
        bar.appendChild(b);
        return b;
    }

    const status = document.createElement('div');
    status.style.cssText = 'flex:1 1 100%;color:#9f9';
    bar.appendChild(status);

    function paint() {
        status.textContent = wing
            ? 'THIS TAB = ' + wing.toUpperCase() + '  host ' + HOST
            : 'CLICK EAST / WEST / KINDROID for this window';
        bar.querySelectorAll('[data-kyros-btn]').forEach((b) => {
            const key = b.getAttribute('data-kyros-btn').toLowerCase();
            b.style.borderColor = key === wing ? '#9f9' : '#555';
            b.style.background = key === wing ? '#143' : '#222';
        });
    }

    function setWing(name) {
        wing = name;
        sessionStorage.setItem('kyrosWing', name);
        paint();
    }

    btn('east', function () { setWing('east'); });
    btn('west', function () { setWing('west'); });
    btn('kindroid', function () { setWing('kindroid'); });
    btn('teach box', function () {
        teaching = 'box';
        status.textContent = 'Now click the chat text box';
    });
    btn('teach send', function () {
        teaching = 'send';
        status.textContent = 'Now click the send button';
    });

    document.addEventListener('pointerdown', function (e) {
        if (!teaching) return;
        if (bar.contains(e.target)) return;
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
            status.textContent = 'No chat box — click teach box, then the field';
            return false;
        }
        chatEl = el;
        el.focus();
        if (el.isContentEditable) {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
        } else {
            const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value') && Object.getOwnPropertyDescriptor(proto, 'value').set;
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
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest(Object.assign({}, opts, { onload: resolve, onerror: reject }));
        });
    }

    async function pickHost() {
        for (let i = 0; i < HOSTS.length; i++) {
            try {
                const res = await gm({ method: 'GET', url: HOSTS[i] + '/roster' });
                if (res.status === 200 && String(res.responseText).indexOf('triggers') !== -1) {
                    HOST = HOSTS[i];
                    return;
                }
            } catch (e) { /* next */ }
        }
    }

    async function postStatus(text) {
        const clean = String(text || '').trim().slice(0, 80);
        if (!clean || clean === lastSuf) return;
        lastSuf = clean;
        try {
            await pickHost();
            const res = await gm({
                method: 'POST',
                url: HOST + '/status',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ text: clean })
            });
            status.textContent = res.status === 200
                ? 'SUF posted: ' + clean
                : 'SUF post failed HTTP ' + res.status;
        } catch (e) {
            status.textContent = 'SUF post failed — is index2 up?';
        }
    }

    function scanStatus() {
        if (!document.body) return;
        const nodes = document.body.querySelectorAll('*');
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            if (seenStatus.has(el) || !el.childNodes || el.childNodes.length !== 1) continue;
            const t = el.textContent || '';
            if (t.indexOf('[SITUATION UPDATE]') !== -1 || t.indexOf('[SIT:') !== -1) {
                seenStatus.add(el);
                continue;
            }
            const m = t.match(/!status\s+([^\n\r]+)/i);
            if (!m) continue;
            seenStatus.add(el);
            postStatus(m[1]);
        }
    }

    async function poll() {
        if (!wing) return;
        try {
            const res = await gm({ method: 'GET', url: HOST + '/poll-web-queue?room=' + encodeURIComponent(wing) });
            const body = JSON.parse(res.responseText || '{}');
            const lines = Array.isArray(body.messages) ? body.messages : [];
            for (let i = 0; i < lines.length; i++) {
                typeLine(lines[i]);
                await new Promise(function (r) { setTimeout(r, 800); });
            }
            if (lines.length) paint();
        } catch (e) {
            status.textContent = 'index2 not reachable on 8081/8080';
        }
    }

    function mount() {
        if (!document.documentElement.contains(bar)) {
            (document.body || document.documentElement).appendChild(bar);
        }
        paint();
    }

    mount();
    setInterval(mount, 3000);
    pickHost().then(paint);
    setInterval(poll, 4000);
    setInterval(scanStatus, 2000);
    const obs = new MutationObserver(function () { scanStatus(); });
    if (document.body) obs.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
