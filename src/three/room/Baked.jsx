import { useLayoutEffect, useRef } from 'react'
import { bakeStatic } from './bake'

// Merges all static JSX meshes inside it into one mesh per material after
// mount. Children stay React-owned (hidden), so props/unmount still work.
export default function Baked({ children }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const g = ref.current
    bakeStatic(g, { hide: true })
    return () => {
      g.children.filter(c => c.name === 'baked').forEach(c => { c.geometry.dispose(); g.remove(c) })
      g.traverse(o => { if (o.isMesh && o.userData.bakedHidden !== false) o.visible = true })
    }
  }, [])
  return <group ref={ref}>{children}</group>
}
