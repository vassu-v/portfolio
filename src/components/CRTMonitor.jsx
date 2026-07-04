import { lazy, Suspense, useEffect, useState } from 'react'

const CRTMonitor3D = lazy(() => import('../three/CRTMonitor3D'))

export default function CRTMonitor({ text, isTag = false }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) return
    setReady(true)
  }, [])

  if (!ready) return null
  return (
    <Suspense fallback={<div style={{ width: '320px', height: '360px' }} />}>
      <CRTMonitor3D text={text} isTag={isTag} />
    </Suspense>
  )
}
