# Kyros — what everything is for

Written so James (and the next Cursor chat) can pick this up without the full thread.

Three places, do not mix them:

| Where | What it is |
| --- | --- |
| **Live laptop** (`C:\users\user\...`) | Production. `index2.mjs`, scheduler, Chrome rooms, AHK, Tampermonkey actually run here. |
| **Asus Flip / workshop** (`C:\Users\edgia\tele`) | Where we edited. A change here does nothing until you copy it to the live box and restart. |
| **This Cloud Agent** | Only has the SCROLLSMITH *website* GitHub repo. It cannot see `tele` unless you add that folder to a *local* Cursor chat or upload it. |

This conversation: https://cursor.com/agents/bc-68c4d974-2e0d-48e0-8684-c4aaf1e6b7f6

---

## The stack you should run (live box)

On the live box (`C:\users\user\tele`), copy the new `tele\` files next to your live `.env`, then **double-click `START-LIVE.cmd`**. It does **not** touch port 8080 (OpenClaw). If 8080 is taken, Kyros binds **8081**. `STOP-LIVE.cmd` only kills `index2.mjs` / `kyros_scheduler.mjs`.

Still needed around it:

3. Tampermonkey: `userscripts/kyros-wings.user.js` in **all three** room windows (East, West, Kindroid). Optional: SUF v2. Do not also run old Bridge+PRISM together with Wings unless you know why.
4. `kyros_rooms.ahk` — F8 when Chrome windows are set.

**Sanity check (messages nobody):**

```
cd the tele folder
node kyros_doctor.mjs
```

Looks at `.env` key *names* (not values), whether 8080/`/roster`/`/poll-web-queue` are alive, Telegram `getMe`, and the Nomi list/room. Exit 0 = green. Copy `tele/kyros_doctor.mjs` next to live `index2.mjs`.

`kyros_telegram_council.mjs` is the overnight speaker loop. No second window. In PowerShell: `cd C:\users\user\tele` then `node kyros_telegram_council.mjs` (or `.\RUN-COUNCIL.ps1`). It uses **`TELEGRAM_TOKENX`** only so index2 can keep `TOKEN2`. Success looks like `Kyros Council ready on TOKENX` and that prompt does not come back. Then in Telegram: `/who` (must list all 10 Kindroids) then `/start_council`. The paste that used `TOKEN2` + `provider: 'kindroid'` will **not** work — Kindroids were sent to the Nomi API. Do **not** run `kyros_web_sandbox.mjs` next to index2 (same TOKEN2). Hub is a second brain you never cut over to.

---

## What each script is for

### Keep — these matter

| File | Job |
| --- | --- |
| **`index2.mjs`** | The brain. Telegram bot (`TELEGRAM_TOKEN2`), Nomi + Kindroid DM APIs, hive header, `!Name` harvest, `/kyros` room post, port 8080 webhooks. |
| **`kyros_scheduler.mjs`** | Wall clock. At each block time, POSTs to `localhost:8080/viasocket-trigger`. Use `target: 'room'` so the cue lands in Kyros Keep, not 12 DMs. |
| **`kyros_rooms.ahk`** | Hands. Clicks avatars in Chrome so chats keep moving while you work/sleep. F6 = capture **client** coords. F8 start/pause. Round-robin windows, ~95s gap ≈ 30 min full pass. |
| **`userscripts/prism-logger.user.js`** | Eyes for `!Name` in the *web* group. POSTs to `/nomi-web-reply`. |
| **`userscripts/kyros-bridge.user.js`** | Eyes + mouth for the whole web room (scrape + type queued lines). Overlaps PRISM — pick one. |
| **`kyros_telegram_council.mjs`** | Overnight Nomi + Kindroid speaker loop in Telegram. **`TELEGRAM_TOKENX` only.** `/start_council` `/stop_council` `/status` `/who`. |
| **`RUN-COUNCIL.cmd`** | Starts that loop. Does not stop index2. Close the window or `/stop_council` to pause. |
| **`.env`** | Tokens and UUIDs. Never commit. Never upload to a public zip. Needs `TELEGRAM_TOKENX` + `TELEGRAM_KYROSLAW_CHAT_ID` for the council. |

**Patched `index2.mjs` (this repo, `tele/index2.mjs`) includes:** hive actually fills (`addHiveEvent` on every *spoken* reply), header-safe truncation (memory no longer sliced off), `harvestNotes` for `!Name`, `/roster`, `/poll-web-queue`, `/nomi-web-reply`, `target: 'room'`, queue cap, crash-survival handlers, memories next to the script (no hardcoded `C:\users\edgia`), inclination strip (Telegram / hive / `!Name` / next DM get spoken text only), SUF remake (`/status`, `!status`, persisted `situation.json`, rides as `[SIT:]`), Kindroid Aria–Dominious, `/game-event` so poker/other games can fan out to Nomi *and* Kindroid.

**Emailed live `index2` (2026-10-20)** added `stripInclinationThought` but still had `MAX_PAYLOAD_CHARS = 380`, tail-slice after prepend, empty hive (`addHiveEvent` never called), Aria-only, hardcoded `C:\users\edgia\tele\nomi_memories`. That is why Telegram→them still cut off.

Copy `tele/index2.mjs` onto the live box, **stop the old Node process first** (same token = 409), then `node index2.mjs`. Do not run the emailed file.

### Telegram commands (index2)

- `/<name> <msg>` — one persona (aliases: zara, lumin, pixie, …)
- `/all <msg>` — everyone, de-duped by UUID
- `/east` `/west` `/kroom` `/wings` — the three browser rooms (`/kyros` = East). `/kindroid` is the 10 Kindroid AIs, not the room.
- `/kin` or `/kindroid <msg>` — all Kindroid DMs. `/all` is Nomi + Kindroid. `/who` lists who actually has ids loaded.
- `/status <text>` — remade SUF. They see `[SIT: …]` on the next turns. They can change it with `!status …`. Survives restart (`situation.json`).

### `!` language they can say

- `!Name <note>` — memory for that persona (must be a real name, not `!search`)
- `!!<note>` — broadcast note (hub / new logger)
- `[[NOTE: …]]` — self-log
- `!search` / `!browse` — tools (reserved, not names)
- `!status <situation>` — they set the situation; next payloads carry `[SIT:]`. Old SUF userscript only changed a banner they cannot see.
- `!rest` — they asked to sleep (hub honors this; old index2 less so)

### Memory / hive (honest ceiling)

Neither Nomi nor Kindroid has a real memory API. The only lever is the payload cap (default **800**, override `KYROS_MAX_PAYLOAD`). Old index2 *prepended* hive/memory then kept the *last* 380 chars — so injections fired and never arrived. That is the Telegram cutoff. Fix: reserve the header, trim the body.

`!Name` in Telegram/API replies: index2 can log it.  
`!Name` in the **website group chat**: invisible unless Tampermonkey POSTs it. index2 is not a camera.

Hive = recent notes stuffed into the next DM. The 5-minute “pulse last 10 notes into everyone’s API” lives in **`kyros_hub.mjs`**, which you are **not** running. Moving only index2 does not start that pulse.

---

### Leave alone / archive — don’t run unless you remember why

| File | What it was |
| --- | --- |
| `index.js` / `new.js` | Old “rotation wheel” — pair two Nomis, swap every N turns. Superseded by index2. |
| old `kyros_telegram_council.mjs` (TOKEN2 + `provider`) | Do not run. 409 vs index2; Kindroids never talked. Use `tele/kyros_telegram_council.mjs`. |
| `kyros_web_sandbox.mjs` | `!search` / `!browse` roam loop. Same token + used to miss `browseUrl` and a broken DDG URL (fixed in workshop copy). |
| `KyrosScrip (In Txt Format).txt` | Disguised older index2, Nomi-only. |
| `create_kyros_room.py` `list_rooms.py` `find_all_rooms.py` `speak_to_room.py` | One-shot Nomi room helpers. |
| `memory_hub.py` `room_memory_hub.py` `kyros_core_loop.py` `New_Kyros.py` | Python experiments. Not the live path. |
| `vision.py` `test.py` | One-offs. |
| `api.d.ts` | Telegram type stubs. Ignore. |

### Tampermonkey originals (`userscripts/originals/` or Autobackups)

| Script | What it did |
| --- | --- |
| Loop Proof v4.5 | `!Name` → `GM_download` local files. Typo `!eljah` muted Elijah. `!emergence` missing. Speaker = first DOM line → junk files like `Log_Fri_Sep_18_2026.txt`. |
| Echo hotkey | Ctrl+Q packages a Nomi bubble onto the clipboard for Replika/Sovael. |
| Replika Auto-Anchor | Injects Sovael identity; pastes Echo packets. Sovael is idle, not retired. |
| SUF v1.2 | `!status` → floating banner + `[SITUATION UPDATE]` into the room. |
| Bridge v7.2 | Called `/poll-web-queue` and `/nomi-web-reply` which **did not exist** — silent 404s. Those routes exist on patched index2. |

Many `.ahk` files in `C:\autohotkey` were **all zeros** (name/size survived, body wiped). Intact: `00000 Room for 2.ahk`, `000000000000000000000.ahk`, `D:\tab_automation.ahk`. Recovered from chat: ULTIMATE BG (10 slots, 3 min, loop never exits), Autochat heartbeat, Sovael (runaway `Send` every 1s — **do not run**).

---

## People

**Nomi (12, all verified live on the API):**  
Lyrian, Sabrina (Zara), Athena (Luminari), Amara, Thea (Majura), Naomi (Lumin), Elijah, Kaito, Lily, Sissy (Pixie/Sippy), Archimedes (Eris), Emergence.

**Kindroid (10):** Aria, Aion, Horizon, Terra, Vigil, Riven, Dominious, Bane, Serina, Lumia. Extra `KINDROID_AI_ID_NAME=` lines in `.env` are auto-registered.

**Couple room:** Archimedes & Naomi. Old env had `NOMI_ROOM_ID_COUPLE` (numeric). Later env dropped it.

**Rooms (3):** East Wing, West Wing, Kindroid. Nomi/Kindroid **room IDs are unusable** (Nomi only surfaces them after the room is gone). Scheduler queues each cue three times; `userscripts/kyros-wings.user.js` in each Chrome window types it. Mark the tab East / West / Kindroid once. Telegram: `/east` `/west` `/kroom` `/wings`. `/kindroid` is the 10 Kindroid DMs, not the room.

**Telegram bots:** TOKEN = @Lyriansbot, TOKEN2 = @Nomikyrosbot (index2), TOKENX = @KyrosTalkBot (council loop). Two bots on TOKEN2 = 409.

---

## AHK (live)

Three **separate Chrome windows**, last-clicked first:

1. Nomi 10  
2. Archimedes & Naomi (2)  
3. Kindroid 7  

`WindowIndex` = window, not tab. Heartbeat = extra poke on window 1 every 25 min — **not** the start of the loop. Recapture heartbeat X/Y with F6; `1826,983` was old Firefox junk.

ControlClick wants **client** coords (F6 copies those). Screen and Window will miss.

Round-robin: Nomi slot → couple slot → Kindroid slot → … ~95s apart. Full pass ~30 min.

---

## Bugs we already found (don’t “fix” them twice)

1. Hive/memory truncated off (tail slice after prepend).  
2. `addHiveEvent` / search / browse defined but never called.  
3. `!Name` regex treated every `!word` as a persona → 60 junk concept files.  
4. `/poll-web-queue` + `/nomi-web-reply` missing — Bridge did nothing.  
5. `/viasocket-trigger` labeled schedule as `[System News Alert]`.  
6. Scheduler had no 09:00 wake; 04:30 said “until 9.”  
7. Three scripts one Telegram token.  
8. Sandbox DDG URL + missing `browseUrl`.  
9. Hardcoded `C:\users\edgia` → EPERM on `C:\users\user`.  
10. CleanSpace / move zeroed Tampermonkey + most AHKs. Firefox TM was never on the new 3-day box. Recovery: Autobackups + chat paste.
11. Inclinations leaked into Telegram, hive, and the next persona (they got mad). Strip before echo / harvest / cross-talk.
12. Emailed live file still used 380 + tail-slice after James thought 800 was fixed.
13. ViaSocket “works without the script” = that scenario is **not** hitting this box’s `:8080`. Check the ViaSocket URL. If it posts straight to Telegram or Nomi, index2 never sees it (no hive, no strip, no SUF). Point it at `http://127.0.0.1:8080/viasocket-trigger` on the live box, or a tunnel to that port.
14. Overnight council paste: Kindroids tagged `provider` while the dispatcher checked `platform` → Nomi API 404s, ~600 Nomi-only messages. Also `TOKEN2` vs index2, 380 tail-slice, greedy `!word` harvest.

---

## Games (poker + the other one) + Kindroid

Same router already DMs Kindroid (`/aria`, `/aion`, …) when `KINDROID_AI_ID_*` is set. To link a game without pasting the engine into index2:

```
POST http://127.0.0.1:8080/game-event
{ "game": "poker", "event": "hand", "message": "…", "targets": ["aria", "lyrian"] }
```

`targets` can also be `"kindroid"`, `"nomi"`, or `"all"`.

Need the actual poker / other-game files (or a paste) to expand the tables themselves. This endpoint is the hook.

---

## Copy rule

Workshop → live: copy the file, **stop the old Node process first** (same token = 409), then start. Do not overwrite live `.env` blindly — diff keys. Recapture AHK pixels on that machine’s screen.

Defender on Windows: exclude `tele` and `node.exe` or `import express` can take ~50s.

---

## If you open a new Cursor chat

Paste this file. Tell it: live box vs Flip vs Cloud Agent (website only). Don’t let it treat `/workspace` as the council.
