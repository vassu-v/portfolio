import { useState, useEffect } from 'react'

export function useMobile(bpOrQuery = 768) {
  const query = typeof bpOrQuery === 'string'
    ? bpOrQuery
    : `(max-width: ${bpOrQuery - 1}px)`

  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = e => setMatches(e.matches)
    mq.addEventListener('change', handler)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

// Portrait-mobile query: phones + portrait tablets
export const PORTRAIT_QUERY =
  '(max-width: 767px), (max-width: 1023px) and (orientation: portrait)'
