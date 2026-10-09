import { useSyncExternalStore } from 'react'
import { readHour } from './hour'
import { detectTier } from './tier'

const listeners = new Set()

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

let state = {
  focus: null,       // null | 'laptop' | 'drawer' | 'diary' | 'corkboard' | 'phone'
  hover: null,       // { id, label } of the object under the pointer
  lampOn: true,
  hour: typeof window !== 'undefined' ? readHour() : 21,
  debug: params.has('debug'),
  folder: -1,        // project folder pulled out of the drawer
  pin: null,         // corkboard item brought forward (corkData id)
  spread: 0,         // diary spread currently open
  page: 0,           // dossier page on top
  explore: false,    // scroll intro finished, objects are clickable
  roam: params.has('roam'), // free-orbit inspection mode, no scroll story
  ...(typeof window !== 'undefined' ? (({ tier, reason }) => ({ tier, tierReason: reason }))(detectTier()) : { tier: 'low', tierReason: 'ssr' }),
}

// Non-reactive values updated every frame (read inside useFrame).
// ?off=rect,shadow,post,env,lamp — debug switches for profiling
export const off = new Set((params.get('off') || '').split(',').filter(Boolean))

export const live = {
  scroll: 0, intro: 0, pointer: { x: 0, y: 0 }, perf: null,
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

export function focusOn(id) {
  room.set({ focus: id, folder: -1, pin: null, hover: null, spread: 0 })
}

if (typeof window !== 'undefined' && params.has('debug')) window.__room = room, window.__live = live
