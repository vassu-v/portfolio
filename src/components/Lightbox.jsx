import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9000,
      }}
    >
      <motion.img
        src={src}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '88vh',
          objectFit: 'contain',
          boxShadow: '0 32px 100px rgba(0,0,0,0.9)',
        }}
      />
      <div style={{
        position: 'absolute', top: '24px', right: '32px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
        letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)',
      }}>
        ESC to close
      </div>
    </motion.div>
  )
}
