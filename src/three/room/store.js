import { useSyncExternalStore } from 'react'
import { readHour } from './hour'
import { detectTier } from './tier'
import { STOP_OBJECT } from './tourData'

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
  drawerShut: false, // visitor shut the drawer the projects stop opened
  diaryShut: false,  // …and the diary the diary stop opened
  hireSeen: false,   // past the projects stop once: the hire-me CTA stays
  side: -1,          // side-project index card lifted out of the second drawer
  tourStop: 'intro', // scroll-tour stop the camera is at (CameraRig TOUR)
  pin: null,         // corkboard item brought forward (corkData id)
  spread: 0,         // diary spread currently open
  page: 0,           // dossier page on top
  photo: -1,         // desk print picked up
  toast: null,       // { text, at } short one-liner (paper-ball shots, etc.)
  struggling: false, // false | 'mild' | 'severe' — measured on the low tier
  measuredFps: 0,
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

const SHADOW_KEYS = new Set(['focus', 'folder', 'pin', 'side', 'lampOn', 'hour', 'curtains', 'drawerShut', 'diaryShut', 'spread', 'page', 'photo', 'tourStop'])

export const room = {
  get: () => state,
  set(patch) {
    const p = typeof patch === 'function' ? patch(state) : patch
    state = { ...state, ...p }
    // shadow maps re-render only when something that casts one may move
    if (Object.keys(p).some(k => SHADOW_KEYS.has(k))) dirtyShadows(p.tourStop ? 70 : 110)
    wake(2500)
    listeners.forEach(l => l())
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

// The object in the visitor's hands: one opened explicitly (laptop, side
// drawer) or the one the current tour stop is about.
export const inHand = s => s.focus || STOP_OBJECT[s.tourStop] || null

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
  // at a tour stop: the drawer / diary it opened can still be shut
  else if (inHand(s) === 'drawer' && !s.drawerShut) room.set({ drawerShut: true })
  else if (inHand(s) === 'diary' && !s.diaryShut) room.set({ diaryShut: true })
}

export function focusOn(id) {
  room.set({ focus: id, folder: -1, side: -1, pin: null, hover: null, spread: 0, photo: -1 })
}

if (typeof window !== 'undefined' && params.has('debug')) window.__room = room, window.__live = live
