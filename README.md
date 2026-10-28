# THE SCROLLSMITH Website

Static HTML/CSS/JS site (no framework). Three gates from a terminal homepage: **Music**, **Doctrine**, **Collective**.

## Structure

- `/` — Terminal homepage (black/green; three gates + Architect signature)
- `/music/` — Music gate (Current Release fronted)
- `/music/current/` — *The Concrete Codex: The Witness (Featuring: The Scrollsmith as Edge)*
- `/doctrine/` — Doctrine index shells (Foundational / Research / Essays / Further)
- `/collective/` — Collective (Kyros, Horizon, PRISM, Community, …)

Shared chrome: `css/styles.css`, `js/main.js` (three-gate nav). Interactive album pattern retained in `js/album-codex-template.js` / vaulted *Codex of Me* page (not in public nav).

## Local Preview

Serve from the repo root (clean folder URLs need a server):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Deploy

Upload all files/folders to the hosting root. Prefer hosts that serve `folder/index.html` for `/folder/`.

## Phase 5 (later)

Old flat paths (`music.html`, `codex.html`, `kyros.html`, `projects.html`, …) remain on disk but are off discovery/nav — add redirects when ready.
