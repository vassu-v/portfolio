# Redesign status (handoff)

Branch `redesign-room` (local only — nothing pushed). Tags you can return to:

| Tag | What |
|---|---|
| `room-v1` | first 3D room homepage |
| `room-v2-perf` | optimised: merged meshes, quality tiers, roam mode, poster fallback |
| `room-v3-interactive` | diary, project dossiers, corkboard wins, phone, live laptop terminal, fuller room |
| `cli-v2` | first CLI redesign (card style) |
| `cli-v3-rice` | riced Linux CLI: waybar, tiling, fastfetch, htop, raw bash left pane |
| `room-v4-tour` | scroll tour (photo intro → board → drawer → diary → laptop+phone finale → free roam), side-projects drawer, throwable paper balls, notifications |

After `cli-v3-rice`: site-wide palette (portrait blue `#84D0E8` + turban orange `#F07A1A`) and the stripped-down curl backend (`api/cli.py`, generated data, blue/orange).

## How to look at it
- `npm run dev` → `/` (3D room), `/?roam` (walk around + inspector), `/?tier=low|mid|high|poster`, `/?ask` (slow-device dialog), `/?classic` (old page)
- `/terminal/` (CLI), `/terminal/#projects` (deep link)
- curl backend: deploy, then `curl <host>`, `/projects/buy4chai`, `/work`, `?plain`
- after editing `src/data/*`, `Experience.jsx` or `corkData.js`: `npm run generate:terminal`

## Round 4 (scroll tour) — how it works
- Tour stops live in `src/three/room/tourData.js`; shots in `CameraRig.jsx` (`SHOTS`), captions in `RoomHome.jsx` (`STOP_COPY`). `room.tourStop` drives the drawer opening and the phone/laptop finale.
- Intro cut-out: `public/me-cutout.webp` (generated from `preview (1).jpg`). Drop a better cut-out at the same path to replace it.
- Side projects: `src/data/sideProjects.js` — **placeholders, waiting for the real list**.
- Notifications: `src/three/room/pings.js`.
- Paper balls: `PaperBalls.jsx` — click to pick up, click a spot to throw.

## Open decisions (asked, not answered yet)
0. Side-projects list (user to send)
2. Optional sound (workshop `audio-assets` SFX)
3. Window light: visitor's local time (current) vs Kolkata live time + weather
4. Visitor sticky notes / keyboard typing / Morse LEDs easter eggs

Docs: `redesign-review.md`, `performance.md`, `references.md`, `cli-references.md`, `shots/`.
