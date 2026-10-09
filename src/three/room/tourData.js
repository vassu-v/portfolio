// Scroll-tour stops, in order. Kept three-free so the HTML shell (RoomHome)
// can read it without pulling the 3D chunk; CameraRig attaches the shots.
export const TOUR = ['intro', 'experience', 'wins', 'projects', 'diary', 'ping', 'finale', 'free'].map(id => ({ id }))

// How much scroll each leg (stop → next stop) gets. The opening leg is long
// so the name has time to drift away into particles.
const WEIGHT = TOUR.map((t, i) => (i === 0 ? 2.6 : 1)).slice(0, -1)
const TOTAL = WEIGHT.reduce((a, b) => a + b, 0)
export const RUNWAY_UNITS = TOTAL

// scroll 0…1 → tour position in stop units (0 … TOUR.length - 1)
export function tourU(s) {
  let x = Math.min(1, Math.max(0, s)) * TOTAL
  for (let i = 0; i < WEIGHT.length; i++) {
    if (x <= WEIGHT[i]) return i + x / WEIGHT[i]
    x -= WEIGHT[i]
  }
  return TOUR.length - 1
}
const stopScroll = i => WEIGHT.slice(0, i).reduce((a, b) => a + b, 0) / TOTAL

// Clicking a section (an object or a chip) doesn't jump "inside" it — it
// scrolls the tour to that section's stop, so the story is never broken.
export function goToStop(id) {
  const i = TOUR.findIndex(t => t.id === id)
  if (i < 0) return
  const max = document.documentElement.scrollHeight - window.innerHeight
  const y = Math.round(max * stopScroll(i))
  window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: y }))
  // touch devices scroll natively (the smooth-scroll shim is wheel-only)
  if (window.matchMedia('(pointer: coarse)').matches) window.scrollTo({ top: y, behavior: 'smooth' })
}

// which object each stop puts in your hands
export const STOP_OBJECT = { experience: 'corkboard', wins: 'corkboard', projects: 'drawer', diary: 'diary', finale: 'phone' }
