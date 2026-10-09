// Three-free so the overlay (eager bundle) can use it without pulling three.
export function readHour() {
  const q = new URLSearchParams(window.location.search).get('hour')
  if (q !== null && !Number.isNaN(parseFloat(q))) return ((parseFloat(q) % 24) + 24) % 24
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

export const isNight = h => !(h > 6 && h < 19.5)
