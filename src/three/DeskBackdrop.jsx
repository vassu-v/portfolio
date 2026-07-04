import { lazy, Suspense, useEffect, useState } from 'react'

const DeskScene = lazy(() => import('./DeskScene'))

export default function DeskBackdrop() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const idle = window.requestIdleCallback
    const id = idle
      ? requestIdleCallback(() => setReady(true), { timeout: 2500 })
      : setTimeout(() => setReady(true), 1200)
    return () => (idle ? cancelIdleCallback(id) : clearTimeout(id))
  }, [])

  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <DeskScene />
    </Suspense>
  )
}
