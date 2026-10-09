// Device quality tiers. Three-free so the eager overlay can import it.
//
//   high   — discrete / Apple-silicon GPUs: AO + bloom + SMAA, 2k sun shadow, lamp shadow
//   mid    — integrated laptop GPUs (Intel Iris/UHD, AMD Radeon Graphics): bloom +
//            tone map only, 1k shadows, lower DPR
//   low    — phones, tablets, ≤4 GB devices: no post-processing, sun shadow only,
//            30 fps idle cap, lighter textures
//   poster — no WebGL2, data-saver, ≤2 GB, or failed probe: a still of the room with
//            the same chips (no 3D at all)
//
// The guess is refined by a short FPS probe after load and remembered per device.

// mp = pixel budget in megapixels. Cost is fill-rate bound (measured: frame
// time scales ~linearly with pixel count), so resolution is set from the
// budget rather than a fixed DPR: a retina phone stays sharp-ish, a 4K
// monitor on an iGPU doesn't melt. maxDpr caps it on dense screens.
export const TIERS = {
  high:   { mp: 3.6, maxDpr: 2,    post: true,  ao: true,  sunMap: 2048, lampShadow: true,  dust: true,  idleFps: 30, sway: true },
  mid:    { mp: 1.6, maxDpr: 1.5,  post: true,  ao: false, sunMap: 1024, lampShadow: true,  dust: true,  idleFps: 30, sway: true },
  low:    { mp: 0.9, maxDpr: 2,    post: false, ao: false, sunMap: 1024, lampShadow: false, dust: false, idleFps: 24, sway: false },
}

export function dprFor(cfg, w = window.innerWidth, h = window.innerHeight) {
  const device = window.devicePixelRatio || 1
  const fit = Math.sqrt((cfg.mp * 1e6) / Math.max(1, w * h))
  return +Math.max(0.6, Math.min(device, cfg.maxDpr, fit)).toFixed(2)
}
export const ORDER = ['high', 'mid', 'low', 'poster']

// v2: v1's probe could wrongly pin capable laptops to 'low' — start fresh
const KEY = 'room-tier-v2'

function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return String(name || '')
  } catch {
    return null
  }
}

export function detectTier() {
  const q = new URLSearchParams(window.location.search).get('tier')
  if (q && ORDER.includes(q)) return { tier: q, reason: 'url override' }
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && ORDER.includes(saved)) return { tier: saved, reason: 'remembered from last visit' }
  } catch { /* storage blocked */ }

  const gpu = gpuName()
  if (gpu === null) return { tier: 'poster', reason: 'no WebGL2' }
  const conn = navigator.connection
  if (conn?.saveData) return { tier: 'poster', reason: 'data saver on' }
  const mem = navigator.deviceMemory // Chrome/Android only, capped at 8
  if (mem && mem <= 2) return { tier: 'poster', reason: `${mem} GB RAM` }
  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) return { tier: 'poster', reason: 'software rendering' }

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.screen.width, window.screen.height) < 820
  if (coarse || small) return { tier: 'low', reason: 'phone / tablet' }
  if (mem && mem <= 4) return { tier: 'low', reason: `${mem} GB RAM` }
  if ((navigator.hardwareConcurrency || 8) <= 4) return { tier: 'low', reason: 'low core count' }

  if (/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|apple m\d|apple gpu|arc\(tm\) a/i.test(gpu)) return { tier: 'high', reason: gpu }
  return { tier: 'mid', reason: gpu || 'integrated GPU' }
}

export function rememberTier(tier) {
  try { localStorage.setItem(KEY, tier) } catch { /* storage blocked */ }
}

export function forgetTier() {
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
}

export const downgrade = t => ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(t) + 1)]
