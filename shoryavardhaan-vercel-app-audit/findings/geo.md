# AI Search Readiness (GEO) — Findings
**Agent:** seo-geo | **Score:** 25/100

## Summary
The site's AI search visibility is currently near zero for all content except the homepage Person schema. The SPA render gap means ChatGPT, Perplexity, ClaudeBot, and Bing Copilot see blank pages at every URL. The one bright spot: robots.txt correctly allows all AI crawlers and the Person schema in static HTML gives AI tools a starting entity signal to work from.

## AI Crawler Access

| Crawler | User-Agent | robots.txt Status | Can Read Content |
|---|---|---|---|
| Googlebot | Googlebot | Allowed | Yes (JS rendered, 2-wave delay) |
| GPTBot (ChatGPT) | GPTBot | Allowed | No (no JS execution) |
| ClaudeBot | ClaudeBot | Allowed | No (no JS execution) |
| PerplexityBot | PerplexityBot | Allowed | No (no JS execution) |
| Bingbot / Copilot | bingbot | Allowed | No (no JS execution for Copilot citation) |
| Google AI Overviews | Googlebot-Extended | Allowed | Yes (via Googlebot render) |

## What AI Crawlers Can Currently Read

**From static HTML (all crawlers):**
- Page title: "Shoryavardhaan Gupta"
- Meta description (homepage text only)
- Person schema (incomplete — see H4)

**From JavaScript execution (Googlebot only):**
- All page content on the homepage
- Dynamic meta/schema for inner pages (after JS renders)

**From no crawler:**
- Blog post content (native)
- Project case study details
- About section text
- Experience / Highlights content

## Critical Findings

### GEO-1: All Content Invisible to Non-Google AI Crawlers
If a ChatGPT user asks "Who is Shoryavardhaan Gupta?" or "Tell me about SarkarSathi", ChatGPT's crawler has seen only:
- Title: "Shoryavardhaan Gupta"
- Description: "16-year-old builder from Kolkata..."
- Incomplete Person schema

No blog post content, no project descriptions, no case study details.

This means AI tools cannot accurately summarize or cite any of the portfolio's actual work. The GEO score would jump from 25 to ~60 after vite-ssg, purely from making content readable.

**Fix:** Resolved by C1 (vite-ssg). Until then, expanding the Person schema (H4) is the only mitigation — AI crawlers can read and use the static JSON-LD even if they can't execute JS.

## High Findings

### GEO-2: Old Vercel Preview URL Competing for Name Queries
`portfolio-vassu-vs-projects.vercel.app` is indexed by Google. When AI tools fetch search results to answer "Shoryavardhaan Gupta", this URL competes for the click. It dilutes the authority signal for the production domain and may be cited with stale content.

**Fix:** Vercel dashboard redirect from preview URL → production URL. No code required.

## GEO Optimization Opportunities (After SSG)

### After vite-ssg is implemented:
1. **Entity consolidation**: The expanded Person schema (@graph with `@id`, `knowsAbout`, `award`, `memberOf`) tells AI crawlers exactly who this person is and what they're known for. AI tools use structured data to build entity knowledge graphs.

2. **Citation-ready passages**: Each project case study should have a one-paragraph "what this is" section at the top — a self-contained, citable passage. AI tools scan for these directly.

3. **Factual specificity**: The blog posts already have this ("43 transactions in the first 72 hours", "13 GitHub stars", "26,000+ entries, Top 1k"). Keep this and expand it.

4. **Brand mention signals**: Currently Shoryavardhaan Gupta appears on GitHub, LinkedIn, Medium, Zenodo, and Instagram. Adding mentions on developer blogs or news coverage would strengthen entity confidence.

## Low Findings

### GEO-3: No /llms.txt
No `/llms.txt` at the domain root. The standard is not yet widely adopted but is gaining traction as an opt-in signal for AI crawlers. A minimal file costs ~15 minutes and positions the site for future AI crawler protocol developments.

**Suggested content:**
```
# Shoryavardhaan Gupta — Portfolio

## About
16-year-old builder and developer from Kolkata, India. Shipping civic tech, hardware, and AI projects since age 14.

## Projects
/project/buy4chai — Buy4Chai: UPI/Razorpay supporter pages for Indian developers
/project/sarkarsathi — SarkarSathi: AI civic tech platform, India Innovates Top 1k 2026
/project/lifi-network — Disaster-resilient LiFi mesh network (CBSE Regional finalist)
/project/chemx — ChemX: chemistry learning tool
/project/planning-research — AI Planning Research (Zenodo preprint)

## Writing
/blog/building-buy4chai — Why Indian developers can't get paid online
/blog/markets-dont-get-disrupted — Markets don't get disrupted, they get rebuilt
```
