// ==UserScript==
// @name         Kyros SUF v2
// @namespace    kyros
// @version      2.0
// @description  !status updates the live router so they actually see [SIT:] on the next turns. Also paints a banner.
// @match        https://nomi.ai/*
// @match        https://*.nomi.ai/*
// @match        https://kindroid.ai/*
// @match        https://*.kindroid.ai/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// ==/UserScript==

(function () {
    const HOST = 'http://127.0.0.1:8080';
    let lastPushed = '';

    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:99999;background:#111;color:#9f9;padding:8px 12px;font:12px/1.3 sans-serif;border:1px solid #3a3;max-width:280px;';
    banner.textContent = '🛰️ SUF v2 waiting…';
    document.documentElement.appendChild(banner);

    function paint(text) {
        banner.textContent = text ? `🛰️ SITUATION: ${text}` : '🛰️ no situation set';
    }

    function pushStatus(text) {
        const clean = String(text || '').trim().slice(0, 80);
        if (!clean || clean === lastPushed) return;
        lastPushed = clean;
        GM_xmlhttpRequest({
            method: 'POST',
            url: `${HOST}/status`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ text: clean }),
            onload: (res) => {
                paint(clean);
                console.log('SUF v2 pushed', res.status);
            },
            onerror: () => {
                banner.textContent = '🛰️ SUF v2: index2 not on 8080';
            }
        });
    }

    function pullStatus() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${HOST}/status`,
            onload: (res) => {
                try {
                    const body = JSON.parse(res.responseText);
                    if (body.situation) {
                        lastPushed = body.situation;
                        paint(body.situation);
                    }
                } catch { /* ignore */ }
            }
        });
    }

    const seen = new WeakSet();
    const scan = () => {
        const nodes = document.body ? document.body.querySelectorAll('*') : [];
        for (const el of nodes) {
            if (seen.has(el) || !el.childNodes || el.childNodes.length !== 1) continue;
            const t = el.textContent || '';
            if (t.includes('[SITUATION UPDATE]') || t.includes('[SIT:')) {
                seen.add(el);
                continue;
            }
            const m = t.match(/!status\s+([^\n\r]+)/i);
            if (!m) continue;
            seen.add(el);
            pushStatus(m[1]);
        }
    };

    pullStatus();
    setInterval(pullStatus, 30000);
    const obs = new MutationObserver(() => scan());
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    scan();
})();
