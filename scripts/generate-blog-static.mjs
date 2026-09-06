import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const blogDir = join(root, 'public', 'blog')

const { POSTS } = await import(pathToFileURL(join(root, 'src', 'data', 'blog.js')).href)

const CRT_STYLE = `    .crt-widget {
      display: flex;
      justify-content: center;
      margin: 36px 0 12px;
    }
    .crt-widget canvas {
      width: 220px;
      height: 138px;
      border-radius: 10px;
      background: #03110a;
      box-shadow: 0 0 0 1px var(--border), 0 18px 40px -20px rgba(74,222,128,0.25);
    }
`

const CRT_HTML = (category) => `
    <div class="crt-widget">
      <canvas id="crtCanvas" width="320" height="200" data-tag="${escapeHtml(category)}"></canvas>
    </div>
`

const CRT_SCRIPT = `
    ;(function () {
      const cv = document.getElementById('crtCanvas')
      if (!cv) return
      const ctx = cv.getContext('2d')
      const GREEN = '#4ade80'
      const text = cv.dataset.tag || ''
      let blinkOn = true

      function draw() {
        const w = cv.width, h = cv.height
        const bg = ctx.createRadialGradient(w / 2, h / 2, 24, w / 2, h / 2, w * 0.72)
        bg.addColorStop(0, '#0b2413')
        bg.addColorStop(1, '#03110a')
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)

        ctx.shadowColor = GREEN
        ctx.shadowBlur = 10
        ctx.fillStyle = GREEN
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        ctx.font = '500 13px "JetBrains Mono", monospace'
        ctx.fillText('$ cat tag', 18, 30)

        ctx.textAlign = 'center'
        ctx.font = '700 26px "JetBrains Mono", monospace'
        ctx.fillText(text.toUpperCase(), w / 2, h / 2 + 2)

        ctx.font = '500 11px "JetBrains Mono", monospace'
        ctx.globalAlpha = 0.55
        ctx.fillText('───────────', w / 2, h / 2 + 32)
        ctx.globalAlpha = 0.8
        ctx.fillText('loaded' + (blinkOn ? ' █' : ''), w / 2, h - 24)
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0

        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)

        const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.68)
        vig.addColorStop(0, 'rgba(0,0,0,0)')
        vig.addColorStop(1, 'rgba(0,0,0,0.55)')
        ctx.fillStyle = vig
        ctx.fillRect(0, 0, w, h)
      }

      draw()
      setInterval(() => { blinkOn = !blinkOn; draw() }, 620)
    })()
`

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function computeMorePosts(post, index) {
  const sameCategory = POSTS.filter((p, i) => i !== index && p.category === post.category)
  const picked = []
  for (const p of sameCategory) {
    if (picked.length >= 2) break
    picked.push(p)
  }
  if (picked.length < 2) {
    // nearest by array index, wrapping around, excluding self and already picked
    const total = POSTS.length
    for (let offset = 1; offset < total && picked.length < 2; offset++) {
      // Try the earlier neighbor first (-1), then the later one — so the true
      // adjacent post is preferred over a wrap-around match at the same offset.
      for (const dir of [-1, 1]) {
        const idx = (index + dir * offset + total) % total
        const candidate = POSTS[idx]
        if (candidate.slug === post.slug) continue
        if (picked.some(p => p.slug === candidate.slug)) continue
        picked.push(candidate)
        if (picked.length >= 2) break
      }
    }
  }
  return picked.slice(0, 2).map(p => ({ slug: p.slug, n: p.n, category: p.category, title: p.title }))
}

function morePostsHtml(morePosts) {
  return morePosts.map(p => `
      <a href="/blog/${p.slug}" class="more-post-row">
        <div class="more-post-inner">
          <span class="more-post-n">${escapeHtml(p.n)}</span>
          <div>
            <div class="more-post-cat">${escapeHtml(p.category)}</div>
            <span class="more-post-title">${escapeHtml(p.title)}</span>
          </div>
        </div>
        <i class="fa-solid fa-arrow-right" style="font-size:0.72rem; color:var(--text3); flex-shrink:0"></i>
      </a>`).join('\n') + '\n    '
}

function replaceGenRegion(html, marker, newInner, file) {
  // Opener uses a non-greedy [\s\S]*? up to the first '-->' rather than [^>]*,
  // so a literal '>' inside the marker's own explanatory comment text can't
  // break the match (it previously would, since '[^>]*' stops at any '>').
  const re = new RegExp(`(<!-- GEN:${marker}[\\s\\S]*?-->)([\\s\\S]*?)(<!-- /GEN:${marker} -->)`)
  if (re.test(html)) {
    return html.replace(re, (_m, open, _inner, close) => `${open}${newInner}${close}`)
  }
  return null // signals: no marker found
}

let anyChanged = false

for (let i = 0; i < POSTS.length; i++) {
  const post = POSTS[i]
  const file = join(blogDir, post.slug, 'index.html')
  if (!existsSync(file)) {
    console.log(`Skip (no static file): ${post.slug}`)
    continue
  }

  let html = readFileSync(file, 'utf8')
  const original = html
  const counterText = `${post.n} / ${pad(POSTS.length)}`
  const ghostText = post.category
  const morePosts = computeMorePosts(post, i)

  // ── NAV COUNTER ──
  let updated = replaceGenRegion(html, 'NAV-COUNTER', counterText, file)
  if (updated !== null) {
    html = updated
  } else {
    const navRe = /(<span class="nav-counter">)([^<]*)(<\/span>)/
    if (navRe.test(html)) {
      html = html.replace(navRe, (_m, open, _inner, close) =>
        `${open}<!-- GEN:NAV-COUNTER -->${counterText}<!-- /GEN:NAV-COUNTER -->${close}`)
    } else {
      console.warn(`WARN [${post.slug}]: could not locate nav-counter region`)
    }
  }

  // ── HERO GHOST ──
  updated = replaceGenRegion(html, 'HERO-GHOST', escapeHtml(ghostText), file)
  if (updated !== null) {
    html = updated
  } else {
    const ghostRe = /(<div class="hero-ghost" aria-hidden="true">)([^<]*)(<\/div>)/
    if (ghostRe.test(html)) {
      html = html.replace(ghostRe, (_m, open, _inner, close) =>
        `${open}<!-- GEN:HERO-GHOST -->${escapeHtml(ghostText)}<!-- /GEN:HERO-GHOST -->${close}`)
    } else {
      console.warn(`WARN [${post.slug}]: could not locate hero-ghost region`)
    }
  }

  // ── MORE POSTS ──
  const morePostsInner = morePostsHtml(morePosts)
  updated = replaceGenRegion(html, 'MORE-POSTS', morePostsInner, file)
  if (updated !== null) {
    html = updated
  } else {
    const mpRe = /(<div class="more-posts">\s*<div class="more-posts-label">More from the log<\/div>\s*)([\s\S]*?)(\s*<\/div>\s*(?:<\/article>|<\/div>\s*<\/article>))/
    if (mpRe.test(html)) {
      html = html.replace(mpRe, (_m, open, _inner, close) =>
        `${open}<!-- GEN:MORE-POSTS -->${morePostsInner}<!-- /GEN:MORE-POSTS -->${close}`)
    } else {
      console.warn(`WARN [${post.slug}]: could not locate more-posts region`)
    }
  }

  // ── CRT WIDGET ──
  // NOTE — bootstrap exception: unlike every other section of this generator,
  // the `else` branch below does NOT stay inside a <!-- GEN:... --> region.
  // It's a one-time structural insert (hero markup + CSS block + inline
  // script) for a post file that predates the CRT widget. Every current post
  // and public/blog/template.html already ship with #crtCanvas, so in normal
  // use ("copy template.html for a new post") this branch never runs — the
  // `if` branch's single data-tag patch is what actually executes on every
  // `npm run generate:blog`. Each inserted piece is still wrapped in its own
  // GEN marker so it's identifiable as script-owned if this path ever does
  // fire. See CLAUDE.md "Static blog system" for the documented exception.
  if (html.includes('id="crtCanvas"')) {
    html = html.replace(/(<canvas id="crtCanvas"[^>]*data-tag=")([^"]*)("[^>]*>)/,
      (_m, pre, _old, post_) => `${pre}${escapeHtml(ghostText)}${post_}`)
  } else {
    // Insert markup right after hero-grid's closing </div>, before hero's closing </div>.
    // Walk backwards from <article class="article">: the div immediately before it is
    // the hero's own closing </div>; the one before that is hero-grid's closing </div>.
    const articleIdx = html.indexOf('<article class="article">')
    let inserted = false
    if (articleIdx !== -1) {
      const before = html.slice(0, articleIdx)
      const heroCloseMatch = before.match(/<\/div>\s*$/)
      if (heroCloseMatch) {
        const closeTagIdx = before.length - heroCloseMatch[0].length + heroCloseMatch[0].indexOf('</div>')
        const beforeHeroClose = before.slice(0, closeTagIdx)
        const heroGridCloseMatch = beforeHeroClose.match(/<\/div>\s*$/)
        if (heroGridCloseMatch) {
          const insertPos = beforeHeroClose.length
          const markup = `<!-- GEN:CRT-BOOTSTRAP -->${CRT_HTML(ghostText)}<!-- /GEN:CRT-BOOTSTRAP -->`
          html = html.slice(0, insertPos) + markup + html.slice(insertPos)
          inserted = true
        }
      }
    }
    if (!inserted) {
      console.warn(`WARN [${post.slug}]: could not locate hero-grid close to insert crt-widget markup`)
    }

    // Insert CSS block before closing </style>, if not already present
    if (!html.includes('.crt-widget')) {
      if (html.includes('</style>')) {
        const css = `\n    /* GEN:CRT-BOOTSTRAP */\n${CRT_STYLE}    /* /GEN:CRT-BOOTSTRAP */\n  `
        html = html.replace('</style>', css + '</style>')
      } else {
        console.warn(`WARN [${post.slug}]: no </style> tag found to insert crt-widget CSS`)
      }
    }

    // Insert drawing script before the closing </script> of the last INLINE page
    // script (no src/type="application/ld+json" attributes) — never the JSON-LD
    // block or an external <script src="..."> tag, regardless of block order.
    if (!html.includes("getElementById('crtCanvas')")) {
      const inlineScriptRe = /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g
      let lastMatch = null
      let m
      while ((m = inlineScriptRe.exec(html)) !== null) lastMatch = m
      if (lastMatch) {
        const closeIdx = lastMatch.index + lastMatch[0].lastIndexOf('</script>')
        const script = `\n      // GEN:CRT-BOOTSTRAP${CRT_SCRIPT}\n      // /GEN:CRT-BOOTSTRAP`
        html = html.slice(0, closeIdx) + script + html.slice(closeIdx)
      } else {
        console.warn(`WARN [${post.slug}]: no inline page <script> found to insert crt-widget script`)
      }
    }
  }

  if (html !== original) {
    writeFileSync(file, html)
    console.log(`Updated: ${post.slug}/index.html`)
    anyChanged = true
  } else {
    console.log(`Unchanged: ${post.slug}/index.html`)
  }
}

console.log(anyChanged ? 'Done — static posts patched.' : 'Done — nothing to change (already up to date).')
