import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live } from './store'

// Accumulates renderer stats across every render call in a frame (shadow
// maps, composer passes) and publishes a 1s rolling summary to live.perf.
export default function PerfProbe() {
  const { gl, scene } = useThree()
  useEffect(() => { window.__scene = scene }, [scene])
  const acc = useRef({ frames: 0, t0: 0, calls: 0, tris: 0, worst: 0, last: 0 })

  useEffect(() => {
    gl.info.autoReset = false
    return () => { gl.info.autoReset = true }
  }, [gl])

  useFrame(() => {
    const a = acc.current
    const now = performance.now()
    if (!a.t0) { a.t0 = now; a.last = now }
    a.worst = Math.max(a.worst, now - a.last)
    a.last = now
    a.frames++
    a.calls += gl.info.render.calls
    a.tris += gl.info.render.triangles
    gl.info.reset()
    if (now - a.t0 >= 1000) {
      const n = a.frames
      live.perf = {
        fps: Math.round((n * 1000) / (now - a.t0)),
        calls: Math.round(a.calls / n),
        tris: Math.round(a.tris / n),
        worstMs: Math.round(a.worst),
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
        programs: gl.info.programs?.length ?? 0,
        dpr: +gl.getPixelRatio().toFixed(2),
        px: `${gl.domElement.width}x${gl.domElement.height}`,
        heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      }
      a.frames = 0; a.calls = 0; a.tris = 0; a.worst = 0; a.t0 = now
    }
  })
  return null
}
