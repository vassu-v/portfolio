import { live, wake } from './store'

// Ambient notifications that land on the laptop or the phone now and then —
// the desk feels lived-in, and each one is a nudge towards something to click.
export const PINGS = [
  { app: 'Shorya', text: 'Want to build something together?', where: 'phone' },
  { app: 'Mail', text: 'Re: the landing page — got 15 min?', where: 'laptop' },
  { app: 'GitHub', text: 'new star on vassu-v/buy4chai', where: 'laptop' },
  { app: 'Calendar', text: '30-min slots open this week', where: 'phone' },
  { app: 'Bits&Bytes', text: 'Kolkata fork — next build night soon', where: 'laptop' },
  { app: 'Shorya', text: 'psst — the drawer has more', where: 'phone' },
]

let n = 0
export function ping(where) {
  const list = where ? PINGS.filter(p => p.where === where) : PINGS
  const p = list[n++ % list.length]
  live.ping = { ...p, until: performance.now() + 6000, id: n }
  wake(6500)
  return p
}
