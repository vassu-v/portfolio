import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext({ path: '/', navigate: () => {}, back: () => {} })

export function Router({ children }) {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to) => {
    window.history.pushState({}, '', to)
    setPath(to)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const back = () => {
    window.history.back()
  }

  return <Ctx.Provider value={{ path, navigate, back }}>{children}</Ctx.Provider>
}

export function useRoute() { return useContext(Ctx) }

export function Link({ to, children, style, className, onClick }) {
  const { navigate } = useRoute()
  return (
    <a
      href={to}
      style={style}
      className={className}
      onClick={e => { e.preventDefault(); onClick?.(); navigate(to) }}
    >
      {children}
    </a>
  )
}
