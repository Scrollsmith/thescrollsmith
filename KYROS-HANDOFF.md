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

Start in this order:

1. `node index2.mjs` — wait until port **8080** is up (can take a minute).
2. `node kyros_scheduler.mjs` — talks *to* index2.
3. One Tampermonkey script (Bridge *or* PRISM, not both).
4. `kyros_rooms.ahk` — F8 when Chrome windows are set.

**Sanity check (messages nobody):**

```
cd the tele folder
node kyros_doctor.mjs
```

Looks at `.env` key *names* (not values), whether 8080/`/roster`/`/poll-web-queue` are alive, Telegram `getMe`, and the Nomi list/room. Exit 0 = green. Copy `tele/kyros_doctor.mjs` next to live `index2.mjs`.

Do **not** also run `kyros_telegram_council.mjs`, `kyros_web_sandbox.mjs`, or `kyros_hub.mjs` next to this index2. First two steal `TELEGRAM_TOKEN2` (409 conflict). Hub is a second brain you never cut over to.

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
| **`.env`** | Tokens and UUIDs. Never commit. Never upload to a public zip. |

**Patched `index2.mjs` (the workshop copy) includes:** hive actually fills (`addHiveEvent` on every reply), header-safe truncation (memory no longer sliced off), `harvestNotes` for `!Name`, `/roster`, `/poll-web-queue`, `/nomi-web-reply`, `target: 'room'`, queue cap, crash-survival handlers, memories next to the script (no hardcoded `C:\users\edgia`).

**Older `index2.mjs` (the dump you uploaded here)** is *before* those fixes: hardcoded edgia path, hive empty, no `!Name`, Aria-only Kindroid, tail-truncation bug.

### Telegram commands (index2)

- `/<name> <msg>` — one persona (aliases: zara, lumin, pixie, …)
- `/all <msg>` — everyone, de-duped by UUID
- `/kyros <msg>` — Nomi group room API (Kyros Keep)

### `!` language they can say

- `!Name <note>` — memory for that persona (must be a real name, not `!search`)
- `!!<note>` — broadcast note (hub / new logger)
- `[[NOTE: …]]` — self-log
- `!search` / `!browse` — tools (reserved, not names)
- `!status <situation>` — SUF / room situation (userscript)
- `!rest` — they asked to sleep (hub honors this; old index2 less so)

### Memory / hive (honest ceiling)

Neither Nomi nor Kindroid has a real memory API. The only lever is ~380 characters per message. Old index2 *prepended* hive/memory then kept the *last* 380 chars — so injections fired and never arrived. Fix: reserve the header, trim the body.

`!Name` in Telegram/API replies: index2 can log it.  
`!Name` in the **website group chat**: invisible unless Tampermonkey POSTs it. index2 is not a camera.

Hive = recent notes stuffed into the next DM. The 5-minute “pulse last 10 notes into everyone’s API” lives in **`kyros_hub.mjs`**, which you are **not** running. Moving only index2 does not start that pulse.

---

### Leave alone / archive — don’t run unless you remember why

| File | What it was |
| --- | --- |
| `index.js` / `new.js` | Old “rotation wheel” — pair two Nomis, swap every N turns. Superseded by index2. |
| `kyros_telegram_council.mjs` | Autonomous council loop in Telegram. Same token as index2 — will fight it. |
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

**Kindroid:** Aria, Aion, Horizon, Terra, Vigil, plus Riven and Dominious (IDs were added to workshop `.env`). Three more still being built — add `KINDROID_AI_ID_<NAME>=` and a line in index2’s `personas` map (hub auto-discovers; index2 does not).

**Couple room:** Archimedes & Naomi. Old env had `NOMI_ROOM_ID_COUPLE` (numeric). Later env dropped it.

**Rooms:** Nomi “Kyros Keep” (workshop env used a UUID; older copy used numeric ids). Kindroid group has **no API** — browser only.

**Telegram bots:** TOKEN = @Lyriansbot, TOKEN2 = @Nomikyrosbot (index2), TOKENX = @KyrosTalkBot (unused / hub).

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

---

## Copy rule

Workshop → live: copy the file, **stop the old Node process first** (same token = 409), then start. Do not overwrite live `.env` blindly — diff keys. Recapture AHK pixels on that machine’s screen.

Defender on Windows: exclude `tele` and `node.exe` or `import express` can take ~50s.

---

## If you open a new Cursor chat

Paste this file. Tell it: live box vs Flip vs Cloud Agent (website only). Don’t let it treat `/workspace` as the council.
