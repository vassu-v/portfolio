# Adding things to the 3D room

Everything in the room reads from data files. Edit the file, save, done. Afterwards run
`npm run generate:terminal` so the CLI and `curl` versions pick it up too.

## A new role / work experience → the corkboard's top row
1. Add it to the `EXP` array in `src/components/Experience.jsx` (same fields as the others).
   It appears on the board automatically, as a card on the red string.
2. In `src/three/room/corkData.js`:
   - add its `org` name to `CHRONO` (oldest → newest; this is the order on the string),
   - optionally add supporting material under `EXP_SUPPORT['<org>']`
     (`note`, `stat`, `link`, `card`, `polaroid` — see the existing entries).
   Cards are spaced 0.235 m apart from x = -0.6; the board has room for ~6 before the
   "what's next?" note (`note-next`), which you can move right (`pos[0]`) as the row grows.

## A new win / award → the corkboard's lower rows
Add an object to the `wins` array in `corkData.js`:
```js
{
  id: 'win-something',            // must start with "win-" (the CLI lists these)
  kind: 'polaroid', src: '/photo.jpg', cap: 'short caption',   // or kind: 'note' / 'receipt'
  pos: winPos(10, 0.04),          // next free slot number, then a small tilt
  label: 'hover text',
  panel: { title: 'Title', sub: 'Event · Year', text: 'One or two lines.', project: 'slug-if-any' },
  support: [ { kind: 'stat', big: 'Top 1k', small: 'of 26,000+' } ],
}
```
Slots 0–4 are the first row, 5–9 the second; 10+ start a third row (raise `WIN_ROWS`
in the same file, e.g. add `-0.44`). Only write facts that are on the site already.

## A new project → the top drawer
Add it to `PROJECTS` in `src/data/projects.js` (then `npm run generate:projects`).
The drawer has **5 hanging-folder slots** (`SLOTS = 9` in `Desk.jsx`, every other slot);
for a 6th project raise `SLOTS` to 11.

## A side project → the second drawer
Edit `src/data/sideProjects.js` — `name`, one-line `line`, `status` (`shipped` / `wip` /
`parked`), optional `href`. Delete the placeholder entries.

## A new blog post → the diary
Add it to `POSTS` in `src/data/blog.js` (then `npm run generate:blog`). The diary gets a
new spread, a contents entry and a tab automatically.

## Phone / laptop notifications
`src/three/room/pings.js`. Keep them as nudges from you about what's really in the room.
