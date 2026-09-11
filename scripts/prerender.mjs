// Renders real React page output to static HTML at build time, for both
// blog posts and project pages.
//
// This is the shared engine behind the "no hand-written static HTML"
// approach: instead of a separate hand-typed noscript summary living
// alongside the live SPA (which can silently drift from it), the exact same
// React component the SPA uses is server-rendered once at build time, and
// its real output is baked directly into the generated static file's
// <div id="root">.
//
// How it works: Vite's programmatic ssrLoadModule() transforms and loads a
// page component (and its whole import tree — router, framer-motion, etc.)
// directly in Node, no separate build step or bundler needed. Every
// component BlogPost.jsx and ProjectPage.jsx depend on is SSR-safe by
// construction: no unguarded window/document access outside effects, and
// the 3D CRT widget (CRTMonitor.jsx) short-circuits to `null` until a
// client-only effect flips it on, so it never even attempts to touch
// three.js/WebGL here.
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

  async function render(componentPath, props) {
    const { default: Component } = await vite.ssrLoadModule(componentPath)
    return renderToStaticMarkup(createElement(Component, props))
  }

  const renderPost    = slug => render('/src/pages/BlogPost.jsx', { slug })
  const renderProject = slug => render('/src/pages/ProjectPage.jsx', { slug })

  async function close() {
    await vite.close()
  }

  return { render, renderPost, renderProject, close }
}

// Allow running standalone for a quick manual spike:
//   node scripts/prerender.mjs blog why-i-build
//   node scripts/prerender.mjs project buy4chai
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const kind = process.argv[2] ?? 'blog'
  const slug = process.argv[3] ?? (kind === 'project' ? 'buy4chai' : 'why-i-build')
  const { renderPost, renderProject, close } = await createPrerenderer()
  const html = kind === 'project' ? await renderProject(slug) : await renderPost(slug)
  console.log(html.slice(0, 2000))
  console.log(`\n\n--- length: ${html.length} chars ---`)
  await close()
}
