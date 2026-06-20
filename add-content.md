# Content Editing Guide

Everything on this portfolio is data-driven. No component logic needs to change to add or update content — only the files listed in this guide.

---

## File Map

| What you want to edit | File |
|---|---|
| Blog posts | `src/data/blog.js` |
| Projects | `src/data/projects.js` |
| Experience (horizontal scroll panels) | `src/components/Experience.jsx` → `EXP` array |
| Highlights / award bento cards | `src/components/Highlights.jsx` → `CARDS` array |
| Currently section cards | `src/components/Currently.jsx` → `CARDS` array |
| Social links in footer | `src/components/Footer.jsx` → `LINKS` array |
| Hero headline / subtitle | `src/components/Hero.jsx` |
| About section paragraphs | `src/components/About.jsx` |
| Birthday (auto-age) | `src/utils/meta.js` |
| Images | `public/` or `public/projects/` |

---

## 1. Blog Posts — `src/data/blog.js`

### Adding a new post

Prepend a new object to the `POSTS` array. **Always keep newest post first** — `LAST_UPDATED` derives automatically from `POSTS[0].date`.

```js
{
  n: '04',                        // sequential number string, pad with zero
  slug: 'my-post-slug',           // URL: /blog/my-post-slug — use kebab-case, no spaces
  title: 'Full title of the post',
  subtitle: 'One sentence description shown on cards and under the title.',
  category: 'Reflection',         // shown as a tag — e.g. Reflection, Building, Perspective
  date: 'Jun 2026',               // human-readable, used for display only
  readTime: '4 min read',
  hero: '/projects/some-image.jpg', // image shown at top of post — must exist in /public
  personal: 'best',               // 'best' | 'learned' | null
  externalUrl: null,              // full URL if post lives on Medium/Substack etc.
  platform: null,                 // e.g. 'Medium' — shown in "Continue reading" button
  content: [                      // see Content Blocks below
    { type: 'paragraph', text: 'First paragraph.' },
    { type: 'pullquote', text: 'A line worth isolating.' },
    { type: 'heading',   text: 'A section title' },
    { type: 'paragraph', text: 'Next paragraph.' },
    { type: 'divider' },
    { type: 'paragraph', text: 'After the divider.' },
  ],
},
```

### Content block types

| Type | What it renders |
|---|---|
| `paragraph` | Body text with scroll-driven brightening and paragraph number in margin |
| `heading` | Section header — `//` marker + italic serif title |
| `pullquote` | Large italic serif quote with copper left border |
| `divider` | Three copper dots centered — use between major sections |

### Updating an existing post

Find the object in `POSTS` by its `slug` and edit any field. The page re-renders automatically.

### Linking to an external piece

```js
externalUrl: 'https://medium.com/@shorya/post-title',
platform: 'Medium',
```

A "Continue reading on Medium" button appears at the end of the post body.

### personal badge values

| Value | Badge displayed |
|---|---|
| `'best'` | Solid copper pill: **my best** |
| `'learned'` | Outlined copper pill: **genuinely learned** |
| `null` | No badge |

### Removing a post

Delete the object from `POSTS`. Update the `n` fields on remaining posts to stay sequential (01, 02 …).

---

## 2. Projects — `src/data/projects.js`

### Adding a new project

Append to the `PROJECTS` array:

```js
{
  n: '05',
  slug: 'project-slug',     // URL: /project/project-slug
  featured: false,          // true = copper tags + star highlight on detail panel
  name: 'Project Name',
  tagline: 'One-line hook shown on the project page header.',
  tags: ['React', 'Vite'],  // tech tags shown as pills
  desc: 'Two–three sentences shown in the hover detail panel on the portfolio.',
  stat: 'Short achievement line — shown with ★ on hover panel',
  github: 'https://github.com/vassu-v/repo',  // null if private
  live: 'https://example.com',                 // null if no live URL
  period: 'Jan 2026',

  // ── detail page (case study) ──────────────────────────────────────────────
  problem: `Multi-line string.
  
  Second paragraph. Use backtick template literals to keep it readable.`,

  solution: `How you solved it. Same format.`,

  how: [
    { label: 'Step label', text: 'Explanation of this part.' },
    { label: 'Another',    text: 'More explanation.' },
  ],

  images: [
    '/projects/myproject_screenshot1.png',  // first image = main scatter stack photo
    '/projects/myproject_screenshot2.png',
  ],

  impact: [
    { val: '10k', label: 'Users' },
    { val: '3',   label: 'Open source contributors' },
  ],
},
```

### `featured: true` vs `false`

- `true` → copper-colored tags, gold star stat, "featured" pill on the portfolio list
- `false` → neutral styling

### Removing a project

Delete the object and update `n` values on remaining entries.

---

## 3. Experience — `src/components/Experience.jsx` → `EXP` array

Each entry is a full-screen horizontal panel in the scroll experience.

```js
{
  n: '06',
  org: 'Organisation Name',   // large display text on the panel
  live: true,                 // true = animated live dot next to org name
  primaryRole: 'Your Title',
  type: 'Internship',         // Internship | Community | Full-time · Equity | Freelance
  period: 'Jun 2026 – Present',
  desc: 'What you did. Keep it to 2–3 sentences.',
  skills: ['Skill A', 'Skill B', 'Skill C'],  // shown as small pills
  extra: null,  // or array of sub-roles:
  // extra: [
  //   { title: 'Consultant', period: 'Jun 2026 – Present', type: 'Part-time' },
  // ],
},
```

The horizontal scroll section automatically adjusts — adding an entry creates a new 100vh slide. No layout changes needed.

---

## 4. Highlights — `src/components/Highlights.jsx` → `CARDS` array

### Standard card

```js
{
  cls: '',                           // layout class — see Layout Classes below
  label: 'Event name · Year',        // small mono label at top of card
  title: 'Achievement Title',
  desc: 'One–two sentence description.',
  border: 'var(--border)',           // card border color
  bg: 'rgba(255,255,255,0.025)',     // card background
  images: [                          // optional polaroid photos that appear on hover
    { src: '/image.jpg', rotate: 6, top: '-44px', right: '-18px' },
  ],
},
```

### Card with a live stat counter

```js
bottom: <StatCard id="unique-id" target={1249} prefix="" color="var(--cu)" />,
```

- `id` — must be unique across all cards
- `target` — the number to count up to
- `prefix` — e.g. `'$'` for dollar amounts, `''` for plain numbers

### Layout classes (cls field)

| Value | Meaning |
|---|---|
| `''` | Single column width |
| `'c2'` | Spans 2 columns (wider card) |
| `'r2'` | Spans 2 rows (taller card) |
| `'tgo'` | Gold border/tint variant |
| `'tcu'` | Copper border/tint variant |
| `'c2 tgo'` | 2-column gold card (combine freely) |

### Polaroid image positioning

```js
images: [
  { src: '/path.jpg', rotate: 8, top: '-42px', right: '-18px' },   // top-right
  { src: '/path.jpg', rotate: -6, bottom: '-36px', left: '-14px' }, // bottom-left
],
```

- `rotate`: degrees — positive = clockwise, negative = counter-clockwise
- Use `top/right/bottom/left` to position. They float outside the card boundary.
- Max 2 images per card looks best.

---

## 5. Currently — `src/components/Currently.jsx` → `CARDS` array

Three cards showing what's actively happening right now.

```js
{
  tag: 'Community',               // category label — Community | Work | Building | Research
  org: 'Organisation or Project',
  desc: 'What you are actively doing. Present tense, 1–2 sentences.',
  pill: 'Active',                 // status pill text — e.g. Active | Shipping | Open source
},
```

Keep it to 3 cards — the grid is hardcoded as 3 columns.

---

## 6. Footer Social Links — `src/components/Footer.jsx` → `LINKS` array

```js
{ icon: 'fa-brands fa-linkedin',  label: 'LinkedIn',  href: 'https://linkedin.com/in/...' },
{ icon: 'fa-brands fa-github',    label: 'GitHub',    href: 'https://github.com/...' },
{ icon: 'fa-solid fa-envelope',   label: 'your@email.com', href: 'mailto:your@email.com' },
```

Icon strings come from Font Awesome 6 Free. Find icon names at fontawesome.com/icons. Any `fa-brands` or `fa-solid` icon works.

---

## 7. Personal Info

### Auto-calculated age

`src/utils/meta.js`

```js
const BIRTH = new Date('2009-09-02')  // ← change this if needed
```

`AGE` and `YEAR` are exported and used across Hero, Footer, and BlogIndex automatically.

### Hero headline and subtitle

`src/components/Hero.jsx` — the scramble names and italic tagline:

```jsx
const line1 = useScramble('SHORYA',   320, 820)   // first name, all caps
const line2 = useScramble('VARDHAAN', 500, 900)   // last name — outline style

// Tagline:
Building <em>something that might matter</em> —<br />
from a desk in Kolkata.
```

### About section text

`src/components/About.jsx` — scroll down to the `<ReadingPara>` blocks and edit the text inline. Each `<ReadingPara>` is one paragraph with scroll-driven brightening.

---

## 8. Images

### Where to put them

| Image type | Folder | Example path |
|---|---|---|
| Project screenshots, exhibits | `public/projects/` | `/projects/buy4chai_live.png` |
| Certificates, events, personal | `public/` | `/syi.png` |

### Naming convention

Use lowercase with underscores. Include a project prefix for project images:

```
public/projects/projectslug_descriptor.ext
```

Examples: `sarkarsathi_cm.jpg`, `buy4chai_readme.png`, `lifi_exhibit.jpeg`

### Supported formats

`.jpg` / `.jpeg` / `.png` / `.webp` — all work fine. Use `.jpg` for photos, `.png` for screenshots with transparency or text.

### Where images are referenced

| Image use | Where to add the path |
|---|---|
| Blog post hero | `src/data/blog.js` → `hero` field |
| Project scatter stack photos | `src/data/projects.js` → `images` array |
| Project case study photo strip | `src/data/projects.js` → `images` array (same) |
| Highlights polaroids | `src/components/Highlights.jsx` → card `images` array |

---

## 9. Routing

Routes are matched in `src/App.jsx`:

| Path | Page |
|---|---|
| `/` | Portfolio homepage |
| `/project/:slug` | Project case study — slug must match a `slug` field in `projects.js` |
| `/blog` | Blog index |
| `/blog/:slug` | Blog post — slug must match a `slug` field in `blog.js` |

No router config to update — slugs in the data files are the URLs.

---

## Quick Reference: Adding a Blog Post End-to-End

1. Put any images in `public/projects/` or `public/`
2. Open `src/data/blog.js`
3. Prepend a new object to `POSTS` (copy the template from Section 1 above)
4. Fill: `n` (next number), `slug` (kebab-case), `title`, `subtitle`, `category`, `date`, `readTime`, `hero`, `personal`, `content` blocks
5. Save — the post appears on `/blog`, the portfolio card section, and `/blog/your-slug`

## Quick Reference: Adding a Project End-to-End

1. Put screenshots in `public/projects/projectname_desc.png`
2. Open `src/data/projects.js`
3. Append a new object to `PROJECTS` (copy the template from Section 2 above)
4. Fill all fields including `problem`, `solution`, `how`, `images`, `impact`
5. Save — the project appears in the portfolio list and at `/project/your-slug`
