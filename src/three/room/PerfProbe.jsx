import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live, off } from './store'

// Accumulates renderer stats across every render call in a frame (shadow
// maps, composer passes) and publishes a 1s rolling summary to live.perf.
// With ?off=gpu the frame is closed with gl.finish(), so `frameMs` is the
// true CPU+GPU cost of one frame regardless of vsync or frame-rate caps.
export default function PerfProbe({ selfRender = false }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => { window.__scene = scene; window.__gl = gl }, [scene, gl])
  const acc = useRef({ frames: 0, t0: 0, calls: 0, tris: 0, worst: 0, last: 0, start: 0, ms: [] })
  const timing = off.has('gpu')

  useEffect(() => {
    gl.info.autoReset = false
    return () => { gl.info.autoReset = true }
  }, [gl])

  useFrame(() => {
    acc.current.start = performance.now()
  }, -1)

  useFrame(() => {
    const a = acc.current
    if (timing) {
      if (selfRender) gl.render(scene, camera)
      gl.getContext().finish()
      a.ms.push(performance.now() - a.start)
    }
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
      const ms = a.ms.sort((x, y) => x - y)
      live.perf = {
        fps: Math.round((n * 1000) / (now - a.t0)),
        frameMs: ms.length ? +ms[Math.floor(ms.length / 2)].toFixed(1) : null,
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
      a.frames = 0; a.calls = 0; a.tris = 0; a.worst = 0; a.t0 = now; a.ms = []
    }
  }, timing ? 2 : 0)
  return null
}
