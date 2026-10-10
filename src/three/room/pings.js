import { live, wake } from './store'

// Ambient notifications that land on the laptop or the phone now and then —
// the desk feels lived-in, and each one is a nudge towards something to click.
// Only nudges from Shorya himself about what's really in the room — no
// invented emails, stars or events.
export const PINGS = [
  { app: 'Shorya', text: 'Want to collaborate on building something cool?', where: 'phone' },
  { app: 'Shorya', text: 'the terminal works — click the screen', where: 'laptop' },
  { app: 'Shorya', text: 'psst — the drawer has more', where: 'phone' },
  { app: 'Shorya', text: 'the corkboard has the receipts', where: 'laptop' },
  { app: 'Shorya', text: 'the diary has my essays', where: 'laptop' },
]

let n = 0
export function ping(where) {
  const list = where ? PINGS.filter(p => p.where === where) : PINGS
  const p = list[n++ % list.length]
  live.ping = { ...p, until: performance.now() + 6000, id: n }
  wake(6500)
  return p
}
