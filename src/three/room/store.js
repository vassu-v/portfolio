import { useSyncExternalStore } from 'react'
import { readHour } from './hour'
import { detectTier } from './tier'

const listeners = new Set()

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

let state = {
  focus: null,       // null | 'laptop' | 'drawer' | 'diary' | 'corkboard' | 'phone'
  hover: null,       // { id, label } of the object under the pointer
  lampOn: true,
  curtains: false,   // drawn shut
  hour: typeof window !== 'undefined' ? readHour() : 21,
  debug: params.has('debug'),
  folder: -1,        // project folder pulled out of the drawer
  side: -1,          // side-project index card lifted out of the second drawer
  tourStop: 'intro', // scroll-tour stop the camera is at (CameraRig TOUR)
  pin: null,         // corkboard item brought forward (corkData id)
  spread: 0,         // diary spread currently open
  page: 0,           // dossier page on top
  photo: -1,         // desk print picked up
  toast: null,       // { text, at } short one-liner (paper-ball shots, etc.)
  struggling: false, // low tier still under ~20 fps after the intro
  explore: false,    // scroll intro finished, objects are clickable
  roam: params.has('roam'), // free-orbit inspection mode, no scroll story
  ...(typeof window !== 'undefined' ? (({ tier, reason }) => ({ tier, tierReason: reason }))(detectTier()) : { tier: 'low', tierReason: 'ssr' }),
}

// Non-reactive values updated every frame (read inside useFrame).
// ?off=rect,shadow,post,env,lamp — debug switches for profiling
export const off = new Set((params.get('off') || '').split(',').filter(Boolean))

export const live = {
  scroll: 0, intro: 0, pointer: { x: 0, y: 0 }, perf: null,
  screenQuad: null, // laptop screen corners in CSS px while focused
  shadowFrames: 90,  // shadow maps re-render only while this is > 0
  activeUntil: 0,    // full-rate rendering until this timestamp, then idle cap
}

export function dirtyShadows(frames = 120) {
  live.shadowFrames = Math.max(live.shadowFrames, frames)
}

export function wake(ms = 1200) {
  live.activeUntil = Math.max(live.activeUntil, performance.now() + ms)
}

export const room = {
  get: () => state,
  set(patch) {
    const p = typeof patch === 'function' ? patch(state) : patch
    state = { ...state, ...p }
    if (Object.keys(p).some(k => k !== 'hover' && k !== 'explore')) dirtyShadows(150)
    wake(2500)
    listeners.forEach(l => l())
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useRoom(selector) {
  return useSyncExternalStore(room.subscribe, () => selector(state), () => selector(state))
}

// Clicking "away" closes one layer at a time: a held photo or a pulled-out
// card first, then the object itself.
export function closeLayer() {
  const s = state
  if (s.photo >= 0) room.set({ photo: -1 })
  else if (s.folder >= 0 || s.pin || s.side >= 0) room.set({ folder: -1, pin: null, side: -1 })
  else if (s.focus) room.set({ focus: null })
}

export function focusOn(id) {
  room.set({ focus: id, folder: -1, side: -1, pin: null, hover: null, spread: 0, photo: -1 })
}

if (typeof window !== 'undefined' && params.has('debug')) window.__room = room, window.__live = live
