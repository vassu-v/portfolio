import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { live } from './store'
import { PHOTO } from './CameraRig'
import { TOUR } from './tourData'

// The tour's opening shot: a spotlight on the framed photo, and the cut-out
// of the same photo standing just proud of the frame. Scrolling slides the
// cut-out back into the frame and fades it, leaving the real framed print.
const SIZE = 0.145

export default function IntroPhoto() {
  const plane = useRef()
  const spot = useRef()
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load('/me-cutout.webp')
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.copy(PHOTO.center)
    return o
  }, [])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), PHOTO.normal), [])

  useFrame(() => {
    const u = live.scroll * (TOUR.length - 1)
    const lift = THREE.MathUtils.smoothstep(u, 0.04, 0.42)
    const p = plane.current
    p.visible = lift < 0.999
    p.position.copy(PHOTO.center).addScaledVector(PHOTO.normal, 0.05 * (1 - lift) + 0.012)
    p.position.y += 0.012 * (1 - lift)
    p.scale.setScalar(1 - 0.3 * lift)
    p.material.opacity = 1 - lift
    spot.current.intensity = 0.4 + 2.2 * (1 - lift) * Math.min(1, live.intro * 1.5)
  })

  return (
    <>
      <primitive object={target} />
      <spotLight ref={spot} target={target} position={PHOTO.center.clone().add(new THREE.Vector3(0.05, 0.45, 0.42))}
        color="#fff0dc" angle={0.3} penumbra={0.75} decay={2} distance={2} />
      <mesh ref={plane} quaternion={quat} renderOrder={2}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#000" map={tex} transparent alphaTest={0.02} roughness={0.9} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.1} depthWrite={false} />
      </mesh>
    </>
  )
}
