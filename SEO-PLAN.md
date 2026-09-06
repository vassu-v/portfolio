# SEO / discoverability plan

Goal: rank on page 1 for "Shoryavardhaan Gupta" and for the project names
(Buy4Chai, SarkarSathi, LiFi Network, ChemX, Planning Research), and get
picked up by AI answer engines (Google AI Overviews, Perplexity, ChatGPT
search) when someone asks about him.

## Baseline findings (Sept 2026 research)

- The site never surfaced for the exact query "Shoryavardhaan Gupta" — what
  ranks instead is name-collision noise (unrelated Wikipedia Guptas, a
  different GitHub user `shourya-gupta`, several unrelated LinkedIn people,
  a rival portfolio `shoryacodes.vercel.app` for a different person).
- None of the real owned profiles (GitHub, LinkedIn, X, Instagram, Medium,
  Zenodo, ORCID) surfaced for any of ~10 query variations tried.
- Project names (Buy4Chai, SarkarSathi, the LiFi project) have essentially
  zero search footprint tying them to him — nobody else owns these terms,
  so whoever gets indexed first for them wins cheaply.
- A stale deploy alias, `portfolio-vassu-vs-projects.vercel.app`, is
  indexed and was competing with the real domain for some name queries.
- The competition is winnable — it's an indexing/citation problem, not a
  competitive-difficulty problem.

## Phase 1 — done (commit `2ecb14e`, domain-agnostic, in this repo)

- Fixed dead canonical-tag injection (`src/App.jsx`) — every SPA route was
  shipping with no `<link rel="canonical">` at all.
- Generated static SEO shells for the 4 project pages that had none
  (`buy4chai`, `lifi-network`, `chemx`, `planning-research`) — previously
  only `sarkarsathi` had one, so crawlers saw generic homepage meta for the
  rest.
- Fixed `alt=""` on real content images (blog cards, project galleries).
- Automated sitemap generation off `blog.js` + `projects.js`
  (`npm run generate:projects`).
- Confirmed already in good shape: robots.txt (`Allow: /`, doesn't block
  AI crawlers), Person/WebSite/ProfilePage JSON-LD with `sameAs`, `llms.txt`,
  Google Search Console site-verification file.

## Phase 2 — domain-dependent, hold until the domain decision

Everything below involves placing the site's URL somewhere external
(a bio field, a directory listing, a backlink). Doing it now means redoing
every single placement if the domain changes later — so it's staged, not
started, pending the domain call.

1. **Buy a custom domain** (e.g. `shoryavardhaangupta.com` / `.dev` / `.me`,
   ~$10–15/yr) and point it at the Vercel project; 301-redirect the old
   `.vercel.app` URL to it. A `.vercel.app` subdomain is shared/high-spam
   and gets crawled with more caution than a real domain — this is the
   single highest-leverage remaining move.
2. **Align every bio link** (GitHub, LinkedIn, X, Instagram, Medium, Zenodo,
   ORCID "Websites & Social Links") to point at the same canonical domain,
   using one exact consistent name string everywhere.
3. **Google Search Console**: verify the final domain (verification file
   already exists for the current one — will need re-verifying if the
   domain changes), submit `sitemap.xml`, request indexing on the homepage.
4. **Investigate `portfolio-vassu-vs-projects.vercel.app`** — it's an old
   Vercel project alias that's indexed and competing with the real site for
   name searches. Check the Vercel dashboard for whether that project can
   be removed/redirected once the custom domain is live.
5. **Backlinks / citations** — free, no-login-required listings first
   (open directories, `awesome-*` GitHub lists relevant to civic tech/open
   source, hackathon/India Innovates result pages if they allow public
   edits). Anything requiring account creation (Product Hunt, most listicle
   directories) needs to be signed up for by him directly — that's a hard
   rule I can't do on his behalf even with permission, so those will be
   handed over as a checklist rather than auto-submitted.

## Realistic timeline

Once Phase 2 lands: roughly 4–12 weeks for the name query to stabilize,
given genuinely low competition once entity signals are consistent.

## Next decision needed

Domain: buy now (recommended, avoids redoing Phase 2 twice) vs. proceed on
`.vercel.app` and accept relinking later.
