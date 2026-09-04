import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const projectDir = join(root, 'public', 'project')
const BASE_URL = 'https://shoryavardhaan.vercel.app'
const BASE_NAME = 'Shoryavardhaan Gupta'

const { PROJECTS } = await import(pathToFileURL(join(root, 'src', 'data', 'projects.js')).href)
const { POSTS } = await import(pathToFileURL(join(root, 'src', 'data', 'blog.js')).href)

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// schema.org has no clean "hardware project" type — map by tag signal instead
// of forcing everything into SoftwareApplication.
function schemaType(project) {
  const tags = project.tags ?? []
  if (tags.includes('AI Research')) return 'ScholarlyArticle'
  if (tags.includes('Hardware') || tags.includes('IoT') || tags.includes('Electronics')) return 'CreativeWork'
  return 'SoftwareApplication'
}

function paragraphs(text) {
  return String(text ?? '')
    .split(/\n\n+/)
    .map(p => `        <p>${escapeHtml(p.trim())}</p>`)
    .join('\n')
}

function projectHtml(project) {
  const url = `${BASE_URL}/project/${project.slug}`
  const type = schemaType(project)
  const ogTitle = `${project.name} — ${BASE_NAME}`
  const links = []
  if (project.github) links.push(`<p><a href="${escapeHtml(project.github)}">GitHub →</a></p>`)
  if (project.live) links.push(`<p><a href="${escapeHtml(project.live)}">${escapeHtml(project.liveLabel ?? 'View live →')}</a></p>`)
  links.push(`<p><a href="${BASE_URL}/">← Back to portfolio</a></p>`)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(project.name)} — ${escapeHtml(BASE_NAME)}</title>

    <meta name="description" content="${escapeHtml(project.desc)}" />
    <meta name="author" content="${escapeHtml(BASE_NAME)}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type"        content="website" />
    <meta property="og:url"         content="${url}" />
    <meta property="og:title"       content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(project.tagline)}" />
    <meta property="og:image"       content="${project.images?.[0] ? BASE_URL + project.images[0] : BASE_URL + '/og-image.png'}" />
    <meta property="og:site_name"   content="${escapeHtml(BASE_NAME)}" />

    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:url"         content="${url}" />
    <meta name="twitter:title"       content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(project.tagline)}" />
    <meta name="twitter:image"       content="${project.images?.[0] ? BASE_URL + project.images[0] : BASE_URL + '/og-image.png'}" />
    <meta name="twitter:creator"     content="@shoryavardhaan" />

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "${type}",
          "@id": "${url}",
          "name": ${JSON.stringify(project.name)},
          "description": ${JSON.stringify(project.desc)},
          "url": "${url}",
          "author": { "@type": "Person", "@id": "${BASE_URL}/#person", "name": ${JSON.stringify(BASE_NAME)} },
          "keywords": ${JSON.stringify(project.tags ?? [])}${project.github ? `,\n          "codeRepository": ${JSON.stringify(project.github)}` : ''}
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "${BASE_URL}/" },
            { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(project.name)}, "item": "${url}" }
          ]
        }
      ]
    }
    </script>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  </head>
  <body>
    <div id="root"></div>
    <noscript>
      <article>
        <h1>${escapeHtml(project.name)}</h1>
        <p>${escapeHtml(project.tagline)} · ${escapeHtml(project.period ?? '')}</p>
        <p>Tags: ${escapeHtml((project.tags ?? []).join(', '))}</p>
        <p><strong>${escapeHtml(project.stat ?? '')}</strong></p>

        <h2>The problem</h2>
${paragraphs(project.problem)}

        <h2>What it does</h2>
${paragraphs(project.solution)}

        <h2>How it works</h2>
        <ul>
${(project.how ?? []).map(h => `          <li><strong>${escapeHtml(h.label)}:</strong> ${escapeHtml(h.text)}</li>`).join('\n')}
        </ul>

        <h2>Impact</h2>
        <ul>
${(project.impact ?? []).map(i => `          <li>${escapeHtml(i.val)} — ${escapeHtml(i.label)}</li>`).join('\n')}
        </ul>

        ${links.join('\n        ')}
      </article>
    </noscript>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
}

let created = 0
for (const project of PROJECTS) {
  const dir = join(projectDir, project.slug)
  const file = join(dir, 'index.html')
  if (existsSync(file)) {
    console.log(`Skip (already exists, hand-maintained): ${project.slug}/index.html`)
    continue
  }
  mkdirSync(dir, { recursive: true })
  writeFileSync(file, projectHtml(project))
  console.log(`Created: project/${project.slug}/index.html`)
  created++
}

// ── Regenerate sitemap.xml from PROJECTS + POSTS so new content is never
// forgotten (previously hand-maintained, per SEO audit finding #7). ──
function sitemapUrl(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

const today = new Date().toISOString().slice(0, 10)
const entries = [
  sitemapUrl(`${BASE_URL}/`, today, 'weekly', '1.0'),
  sitemapUrl(`${BASE_URL}/blog`, today, 'weekly', '0.8'),
  ...POSTS.map(p => sitemapUrl(`${BASE_URL}/blog/${p.slug}`, p.isoDate ?? today, 'monthly', p.n === '01' ? '0.9' : '0.7')),
  ...PROJECTS.map(p => sitemapUrl(`${BASE_URL}/project/${p.slug}`, today, 'monthly', p.featured ? '0.8' : '0.7')),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${entries.join('\n\n')}\n\n</urlset>\n`
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap)
console.log('Regenerated: public/sitemap.xml')

console.log(created > 0 ? `Done — ${created} project page(s) created.` : 'Done — no new project pages needed.')
