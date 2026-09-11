// Renders each blog post's real React output to static HTML at build time.
//
// This replaces the old hand-written <noscript> article duplication. There is
// now exactly one source of truth for post content — src/data/blog.js,
// rendered through the exact same src/pages/BlogPost.jsx component the live
// SPA uses — so the static shell and the live page can never drift apart.
//
// How it works: Vite's programmatic ssrLoadModule() transforms and loads
// BlogPost.jsx (and its whole import tree — router, framer-motion, etc.)
// directly in Node, no separate build step or bundler needed. Every
// component BlogPost depends on is SSR-safe by construction: no unguarded
// window/document access outside effects, and the 3D CRT widget
// (CRTMonitor.jsx) short-circuits to `null` until a client-only effect
// flips it on, so it never even attempts to touch three.js/WebGL here.
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

export async function createPrerenderer() {
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
  })

  async function renderPost(slug) {
    const { default: BlogPost } = await vite.ssrLoadModule('/src/pages/BlogPost.jsx')
    return renderToStaticMarkup(createElement(BlogPost, { slug }))
  }

  async function close() {
    await vite.close()
  }

  return { renderPost, close }
}

// Allow running standalone for a quick manual spike: node scripts/prerender-blog.mjs <slug>
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const slug = process.argv[2] ?? 'why-i-build'
  const { renderPost, close } = await createPrerenderer()
  const html = await renderPost(slug)
  console.log(html.slice(0, 2000))
  console.log(`\n\n--- length: ${html.length} chars ---`)
  await close()
}
