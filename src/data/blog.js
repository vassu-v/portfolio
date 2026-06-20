// ─── Blog posts ────────────────────────────────────────────────────────────────
//
// Keep posts ordered newest-first — LAST_UPDATED derives from POSTS[0].date.
//
// Content block types:
//   { type: 'paragraph', text: '...' }
//   { type: 'heading',   text: '...' }
//   { type: 'pullquote', text: '...' }   ← rendered as large italic quote
//   { type: 'divider' }                  ← three dots separator
//
// personal: 'best' | 'learned' | null
// externalUrl + platform: set if the full piece lives on Medium/Substack/etc.

export const POSTS = [
  {
    n: '01',
    slug: 'building-while-studying',
    title: 'Building while everyone else is studying',
    subtitle: 'On shipping SarkarSathi during board exams and what that season taught me about constraint.',
    category: 'Reflection',
    date: 'Mar 2026',
    readTime: '5 min read',
    hero: '/projects/sarkarsathi_cm.jpg',
    personal: 'learned',
    externalUrl: null,
    platform: null,
    content: [],
  },
  {
    n: '02',
    slug: 'what-shipping-feels-like',
    title: 'What shipping at 16 actually feels like',
    subtitle: 'Nobody tells you the anticlimactic part. The repo is public. Now what.',
    category: 'Building',
    date: 'Feb 2026',
    readTime: '4 min read',
    hero: '/projects/buy4chai_community.png',
    personal: 'best',
    externalUrl: null,
    platform: null,
    content: [],
  },
  {
    n: '03',
    slug: 'explaining-projects-to-teachers',
    title: 'Why I stopped explaining my projects to teachers',
    subtitle: 'It wasn\'t resentment. It was just a better use of the same energy.',
    category: 'Perspective',
    date: 'Jan 2026',
    readTime: '3 min read',
    hero: '/projects/lifi_exhibit.jpeg',
    personal: 'learned',
    externalUrl: null,
    platform: null,
    content: [],
  },
]

export function getPost(slug) {
  return POSTS.find(p => p.slug === slug) ?? null
}

// Automatically reflects the date of the newest post (POSTS[0])
export const LAST_UPDATED = POSTS[0]?.date ?? '—'
