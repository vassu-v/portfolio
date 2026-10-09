import { useSyncExternalStore } from 'react'
import { readHour } from './hour'

const listeners = new Set()

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

let state = {
  focus: null,       // null | 'laptop' | 'drawer' | 'diary' | 'corkboard' | 'phone'
  hover: null,       // { id, label } of the object under the pointer
  lampOn: true,
  hour: typeof window !== 'undefined' ? readHour() : 21,
  debug: params.has('debug'),
  folder: -1,        // project folder pulled out of the drawer
  card: -1,          // corkboard card brought forward
  explore: false,    // scroll intro finished, objects are clickable
}

// Non-reactive values updated every frame (read inside useFrame).
export const live = { scroll: 0, intro: 0, pointer: { x: 0, y: 0 } }

export const room = {
  get: () => state,
  set(patch) {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
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
  room.set({ focus: id, folder: -1, card: -1, hover: null })
}

if (typeof window !== 'undefined' && params.has('debug')) window.__room = room
