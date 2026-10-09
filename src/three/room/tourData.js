// Scroll-tour stops, in order. Kept three-free so the HTML shell (RoomHome)
// can read it without pulling the 3D chunk; CameraRig attaches the shots.
export const TOUR = ['intro', 'experience', 'wins', 'projects', 'diary', 'ping', 'finale', 'free'].map(id => ({ id }))

// Clicking a section (an object or a chip) doesn't jump "inside" it — it
// scrolls the tour to that section's stop, so the story is never broken.
export function goToStop(id) {
  const i = TOUR.findIndex(t => t.id === id)
  if (i < 0) return
  const max = document.documentElement.scrollHeight - window.innerHeight
  const y = Math.round((max * i) / (TOUR.length - 1))
  window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: y }))
  // touch devices scroll natively (the smooth-scroll shim is wheel-only)
  if (window.matchMedia('(pointer: coarse)').matches) window.scrollTo({ top: y, behavior: 'smooth' })
}

// which object each stop puts in your hands
export const STOP_OBJECT = { experience: 'corkboard', wins: 'corkboard', projects: 'drawer', diary: 'diary', finale: 'phone' }
