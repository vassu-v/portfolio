# Content Quality (E-E-A-T) — Findings
**Agent:** seo-content | **Score:** 55/100

## Summary
The content itself is genuinely strong — first-person, specific, data-backed, with real credentials behind it. The score is held back by delivery problems (posts invisible to crawlers) and structural gaps (no headings, no author byline, one post title that hides its search value). Fix the structural issues and content quality jumps to ~75/100 on its own.

## E-E-A-T Signals Present (Keep These)
- **Experience**: Buy4Chai is a deployed product (not a side project). SarkarSathi entered India Innovates (26,000+ entries, Top 1k). LiFi network is a working hardware prototype, CBSE Regional finalist.
- **Expertise**: Zenodo preprint published at age 15 ("AI Planning Agents, Not Tools"). Co-authored LinkedIn article on AI verification with peer professional.
- **Authoritativeness**: India Innovates Top 1k badge, GitHub public repos with 13+ stars, Kolkata Fork Lead at Bits&Bytes, Youth Partner at 4MQ.org.
- **Trustworthiness**: Real name, real location (Kolkata), consistent identity across GitHub/LinkedIn/Instagram.

## Blog Post Analysis

| Post | Words (est.) | Headings | Author Visible | ISO Date | Crawlable |
|---|---|---|---|---|---|
| building-buy4chai | ~250 | None | No | No | No (SPA) |
| markets-dont-get-disrupted | ~267 | None | No | No | No (SPA) |
| apple-ai-decade | External (Medium) | — | — | No | No (stub) |
| both-groups-are-losing | External (LinkedIn) | — | — | No | No (stub) |
| hardware-failure | External (Medium) | — | — | No | No (stub) |

## Critical Findings

### C6: Buy4Chai Post Title Hides Search Intent
**Current title:** "The gap nobody was filling."
**Search intent this post serves:** "Indian developer payment link", "Buy Me a Coffee India alternative", "Razorpay supporter page", "UPI link for creators"
**Problem:** None of those queries match the title. Users who need this content can't find it. The post itself is exactly the answer they're looking for.
**Fix:** Retitle to surface the keyword. Options:
- "Why Indian developers can't get paid online — and how I fixed it"
- "Building the Indian equivalent of Buy Me a Coffee"
- "UPI support pages for developers: what I built and why"

## High Findings

### H8: No Author Byline on Blog Posts
`BlogPost.jsx` renders title, date, subtitle, and content — but no author name. Google's Search Quality Rater Guidelines explicitly ask "Who wrote this?" as a quality signal. One line fix.

**Fix:** Add `by Shoryavardhaan Gupta` to the post header in `BlogPost.jsx`. Style it like the date (mono, muted, small).

## Medium Findings

### M2: No Headings in Native Blog Post Bodies
Both native posts (building-buy4chai, markets-dont-get-disrupted) are single paragraphs with no internal H2/H3 structure. This reads as thin content regardless of word count and limits Google's ability to understand subtopic coverage.

**Fix:** Add `{type:'heading', level:2, text:'...'}` blocks to the content arrays in `blog.js`. Render in `BlogPost.jsx` as `<h2>`.

### M3: No Internal Links in Blog Content
No blog post links to a related project page or to another post. This is a missed opportunity to distribute PageRank and signal topical authority clusters.

**Fix:**
- building-buy4chai → link to `/project/buy4chai` within the body
- hardware-failure → link to `/project/lifi-network`
- markets-dont-get-disrupted → link to `/project/buy4chai` (market context)

### M11: External Posts Create Thin Native Stubs
Posts 03-05 (apple-ai-decade, both-groups-are-losing, hardware-failure) link to Medium/LinkedIn with native `content: []`. These pages have no crawlable text beyond title and subtitle. Google may classify them as doorway pages.

**Fix options (pick one):**
1. Expand native summaries to ~200+ words before the external link
2. Add canonical pointing to the external URL (if content is substantially there)
3. Block these stub pages with `noindex` and link to external directly from the blog index

## Low Findings

### L5: No Narrative Origin Post
No post targeting the "16 year old developer India" or "student builder Kolkata" intent cluster. This is the query that most naturally leads to this portfolio's target audience (collaborators, investors, journalists). A first-person origin story would serve it well.
