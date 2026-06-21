import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const dist = 'dist'
const mainHtml = readFileSync(join(dist, 'index.html'), 'utf8')

const scriptTag = mainHtml.match(/<script type="module"[^>]+src="\/assets\/[^"]*"[^>]*><\/script>/)?.[0]
if (!scriptTag) { console.error('Could not find hashed script tag in dist/index.html'); process.exit(1) }

const linkTags = [...mainHtml.matchAll(/<link[^>]+rel="(?:modulepreload|stylesheet)"[^>]+href="\/assets\/[^"]*"[^>]*\/?>/g)].map(m => m[0])

const injection = [...linkTags, scriptTag].join('\n    ')
const placeholder = '<script type="module" src="/src/main.jsx"></script>'

let updated = 0
for (const section of ['blog', 'project']) {
  const dir = join(dist, section)
  if (!existsSync(dir)) continue
  for (const slug of readdirSync(dir)) {
    const file = join(dir, slug, 'index.html')
    if (!existsSync(file)) continue
    const html = readFileSync(file, 'utf8')
    if (!html.includes(placeholder)) continue
    writeFileSync(file, html.replace(placeholder, injection))
    console.log(`Patched: ${file}`)
    updated++
  }
}
console.log(`Done — patched ${updated} static pre-render(s).`)
