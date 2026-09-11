// Generates public/project/<slug>/index.html for every project in
// src/data/projects.js.
//
// Like the blog generator, this fully regenerates every file from a single
// source of truth. public/project/<slug>/index.html's <div id="root"> is
// filled with the REAL src/pages/ProjectPage.jsx component, server-rendered
// via scripts/prerender.mjs (Vite SSR + react-dom/server) — the exact same
// component the live SPA uses, so static and live content can never
// disagree. This replaced an earlier design where #root was left empty and
// crawler-visible content was a hand-written <noscript> paraphrase of
// problem/solution/how/impact — that could drift from the live page the
// same way the old blog static shells could, so it's gone now too.
//
// Adding a new project is just: add an entry to PROJECTS, run this script.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createPrerenderer } from './prerender.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const projectDir = join(root, 'public', 'project')
const BASE_URL = 'https://shoryavardhaan.vercel.app'
const BASE_NAME = 'Shoryavardhaan Gupta'

const { PROJECTS } = await import(pathToFileURL(join(root, 'src', 'data', 'projects.js')).href)
const { POSTS } = await import(pathToFileURL(join(root, 'src', 'data', 'blog.js')).href)
const { projectJsonLdNode } = await import(pathToFileURL(join(root, 'src', 'utils', 'projectSeo.js')).href)

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Pulled straight from src/index.css so the pre-hydration paint uses the
// exact same design tokens as the live site — see generate-blog-static.mjs
// for the same pattern and why it matters.
const indexCss = readFileSync(join(root, 'src', 'index.css'), 'utf8')
const rootBlockMatch = indexCss.match(/:root\s*\{[\s\S]*?\n\}/)
if (!rootBlockMatch) throw new Error('Could not find :root block in src/index.css')
const rootBlock = rootBlockMatch[0]

// Mirrors the project branch of the SPA's per-route meta effect in
// src/App.jsx — same canonical URL, so a crawler with or without JS must
// see identical title/description/JSON-LD either way.
function metaFor(project) {
  const url = `${BASE_URL}/project/${project.slug}`
  const title = `${project.name} | ${BASE_NAME}`
  const img = project.images?.[0] ? `${BASE_URL}${project.images[0].src}` : `${BASE_URL}/og-image.png`
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      projectJsonLdNode(project, { baseUrl: BASE_URL, baseName: BASE_NAME, url }),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: project.name, item: url },
        ],
      },
    ],
  }
  return { title, desc: project.tagline, url, img, jsonld }
}

function pageHtml({ title, desc, url, img, jsonld, bodyHtml }) {
  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="author" content="${escapeHtml(BASE_NAME)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${url}" />
  <meta property="og:title"       content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image"       content="${img}" />
  <meta property="og:site_name"   content="${escapeHtml(BASE_NAME)}" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:url"         content="${url}" />
  <meta name="twitter:title"       content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image"       content="${img}" />
  <meta name="twitter:creator"     content="@shoryavardhaan" />
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    ${rootBlock}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:clip;cursor:auto}
  </style>
</head>
<body>
  <div id="root">${bodyHtml}</div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`
}

const onlySlug = process.argv[2]
const targets = onlySlug ? PROJECTS.filter(p => p.slug === onlySlug) : PROJECTS
if (onlySlug && targets.length === 0) {
  console.error(`No project with slug "${onlySlug}" found in projects.js`)
  process.exit(1)
}

const { renderProject, close } = await createPrerenderer()

let created = 0, updated = 0, unchanged = 0
for (const project of targets) {
  const meta = metaFor(project)
  const bodyHtml = await renderProject(project.slug)
  const html = pageHtml({ ...meta, bodyHtml })

  const dir = join(projectDir, project.slug)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'index.html')
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : null

  if (existing === html) {
    console.log(`Unchanged: project/${project.slug}/index.html`)
    unchanged++
  } else {
    writeFileSync(file, html)
    console.log(`${existing === null ? 'Created' : 'Updated'}: project/${project.slug}/index.html`)
    existing === null ? created++ : updated++
  }
}

await close()

// ── Regenerate sitemap.xml from PROJECTS + POSTS so new content is never
// forgotten (previously hand-maintained, per SEO audit finding #7). ──
function sitemapUrl(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

// Bump this by hand when the homepage, blog index, or a project actually
// changes — NOT on every generator run. Using new Date() here would stamp
// every URL as "modified today" on every run regardless of real content
// changes, which is misleading to crawlers. Individual posts still use
// their own p.isoDate; projects fall back to p.lastmod if set, else this.
const SITE_LAST_UPDATED = '2026-09-06'
const entries = [
  sitemapUrl(`${BASE_URL}/`, SITE_LAST_UPDATED, 'weekly', '1.0'),
  sitemapUrl(`${BASE_URL}/blog`, SITE_LAST_UPDATED, 'weekly', '0.8'),
  ...POSTS.map(p => sitemapUrl(`${BASE_URL}/blog/${p.slug}`, p.isoDate ?? SITE_LAST_UPDATED, 'monthly', p.n === '01' ? '0.9' : '0.7')),
  ...PROJECTS.map(p => sitemapUrl(`${BASE_URL}/project/${p.slug}`, p.lastmod ?? SITE_LAST_UPDATED, 'monthly', p.featured ? '0.8' : '0.7')),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${entries.join('\n\n')}\n\n</urlset>\n`
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap)
console.log('Regenerated: public/sitemap.xml')

console.log(`Done — ${created} created, ${updated} updated, ${unchanged} unchanged.`)
