import * as THREE from 'three'

// Keyframes across a 24h day. sun: intensity of direct light through the
// window, sky: gradient top/bottom seen through the glass, amb: env strength.
const KEYS = [
  { h: 0,    sunColor: '#8ea7d6', sun: 0.35, skyTop: '#05070d', skyBot: '#141a2b', amb: 0.14, stars: 1 },
  { h: 5,    sunColor: '#8ea7d6', sun: 0.3,  skyTop: '#0a0f1e', skyBot: '#2a2340', amb: 0.15, stars: 0.7 },
  { h: 6.3,  sunColor: '#ff9a5a', sun: 1.2,  skyTop: '#3b4a74', skyBot: '#f2a273', amb: 0.25, stars: 0 },
  { h: 8,    sunColor: '#ffd2a1', sun: 3.4,  skyTop: '#6f9bd1', skyBot: '#f3d7b5', amb: 0.7,  stars: 0 },
  { h: 12.5, sunColor: '#fff3e2', sun: 4.2,  skyTop: '#4f86cc', skyBot: '#bcd6ef', amb: 0.95, stars: 0 },
  { h: 16.5, sunColor: '#ffd9a8', sun: 3.8,  skyTop: '#6a93c8', skyBot: '#f1d6ae', amb: 0.8,  stars: 0 },
  { h: 18,   sunColor: '#ff9548', sun: 3.2,  skyTop: '#4d5d8f', skyBot: '#ff9a55', amb: 0.45, stars: 0 },
  { h: 19.2, sunColor: '#c97a8a', sun: 0.8,  skyTop: '#1d2142', skyBot: '#8a4f6a', amb: 0.16, stars: 0.3 },
  { h: 20.5, sunColor: '#8ea7d6', sun: 0.4,  skyTop: '#080b16', skyBot: '#1b2036', amb: 0.14, stars: 1 },
  { h: 24,   sunColor: '#8ea7d6', sun: 0.35, skyTop: '#05070d', skyBot: '#141a2b', amb: 0.14, stars: 1 },
]

const ca = new THREE.Color(), cb = new THREE.Color()
const mix = (a, b, t) => ca.set(a).lerp(cb.set(b), t).clone()

export function sky(hour) {
  let i = 0
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= hour) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const t = THREE.MathUtils.smoothstep(hour, a.h, b.h)
  const day = hour > 6 && hour < 19.5
  // Sun arcs from front-left (morning) to back-left (evening); at night the
  // "sun" is the moon, high and cool. Light always enters through the window
  // on the -X wall, travelling toward +X.
  const p = day ? (hour - 6) / 13.5 : ((hour + 24 - 19.5) % 24) / 10.5
  const elev = day ? 0.18 + Math.sin(p * Math.PI) * 0.75 : 0.55 + Math.sin(p * Math.PI) * 0.25
  const dir = new THREE.Vector3(1, -elev, (0.5 - p) * 0.9).normalize()
  return {
    hour,
    day,
    night: !day,
    sunColor: mix(a.sunColor, b.sunColor, t),
    sun: THREE.MathUtils.lerp(a.sun, b.sun, t),
    skyTop: mix(a.skyTop, b.skyTop, t),
    skyBot: mix(a.skyBot, b.skyBot, t),
    amb: THREE.MathUtils.lerp(a.amb, b.amb, t),
    stars: THREE.MathUtils.lerp(a.stars, b.stars, t),
    dir,
  }
}
