// Generates public/blog/<slug>/index.html for every post in src/data/blog.js.
//
// This is a full rewrite of the old GEN-marker patcher. There is no more
// hand-written article prose living in these files at all — the entire
// <body> is the REAL src/pages/BlogPost.jsx component, rendered to static
// HTML at build time via scripts/prerender.mjs (Vite SSR, see that file
// for how/why it's safe). src/data/blog.js is now the only place post
// content exists; these files are fully regenerated from it every run, and
// safe to delete and regenerate at any time — there is nothing hand-authored
// left in them to lose.
//
// Adding a new post is now just: add an entry to POSTS, run this script.
// There is no template to copy and no [FILL:...] placeholders to fill in —
// public/blog/template.html has been retired.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createPrerenderer } from './prerender.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const blogDir = join(root, 'public', 'blog')
const BASE_URL = 'https://shoryavardhaan.vercel.app'
const BASE_NAME = 'Shoryavardhaan Gupta'
const BASE_IMG = `${BASE_URL}/og-image.png`

const { POSTS } = await import(pathToFileURL(join(root, 'src', 'data', 'blog.js')).href)

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Pulled straight from src/index.css so the pre-hydration paint (the instant
// before main.jsx's bundle finishes loading and the real stylesheet takes
// over) uses the exact same design tokens as the live site — single source
// of truth, can't drift the way a hand-copied :root block could.
const indexCss = readFileSync(join(root, 'src', 'index.css'), 'utf8')
const rootBlockMatch = indexCss.match(/:root\s*\{[\s\S]*?\n\}/)
if (!rootBlockMatch) throw new Error('Could not find :root block in src/index.css')
const rootBlock = rootBlockMatch[0]

// Mirrors the blog-post branch of the SPA's per-route meta effect in
// src/App.jsx exactly — same canonical URL, so a crawler with or without JS
// must see identical title/description/JSON-LD either way.
function metaFor(post) {
  const title = `${BASE_NAME} — ${post.title}`
  const desc = post.subtitle
  const url = `${BASE_URL}/blog/${post.slug}`
  const img = post.hero ? `${BASE_URL}${post.hero}` : BASE_IMG
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': url,
        headline: post.title,
        description: post.subtitle,
        url,
        datePublished: post.isoDate ?? post.date,
        dateModified: post.isoDate ?? post.date,
        image: { '@type': 'ImageObject', url: img },
        author: { '@type': 'Person', '@id': `${BASE_URL}/#person`, name: BASE_NAME, url: BASE_URL },
        publisher: { '@type': 'Person', name: BASE_NAME, url: BASE_URL },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        inLanguage: 'en-IN',
        keywords: post.keywords ?? [],
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#post-subtitle'] },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Log', item: `${BASE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  }
  return { title, desc, url, img, jsonld }
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
  <meta property="og:type"        content="article" />
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
const targets = onlySlug ? POSTS.filter(p => p.slug === onlySlug) : POSTS
if (onlySlug && targets.length === 0) {
  console.error(`No post with slug "${onlySlug}" found in blog.js`)
  process.exit(1)
}

const { renderPost, close } = await createPrerenderer()

let created = 0, updated = 0, unchanged = 0
for (const post of targets) {
  const meta = metaFor(post)
  const bodyHtml = await renderPost(post.slug)
  const html = pageHtml({ ...meta, bodyHtml })

  const dir = join(blogDir, post.slug)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'index.html')
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : null

  if (existing === html) {
    console.log(`Unchanged: blog/${post.slug}/index.html`)
    unchanged++
  } else {
    writeFileSync(file, html)
    console.log(`${existing === null ? 'Created' : 'Updated'}: blog/${post.slug}/index.html`)
    existing === null ? created++ : updated++
  }
}

await close()

// template.html is retired — there's nothing to copy/fill-in anymore.
const templatePath = join(blogDir, 'template.html')
if (existsSync(templatePath)) {
  rmSync(templatePath)
  console.log('Removed: blog/template.html (retired — see CLAUDE.md "Static blog system")')
}

console.log(`Done — ${created} created, ${updated} updated, ${unchanged} unchanged.`)
