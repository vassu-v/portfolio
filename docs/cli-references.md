# CLI mode: references and redesign spec

Research for redesigning `/terminal/index.html` (vanilla HTML/CSS/JS, no build step).
The page is also the **automatic fallback** for devices that can't run the 3D homepage,
so it has to be fast, accessible, and good on low-end phones.

URLs checked on 2026-10-09 with an HTTP request (200 = loads). Details about how a site
looks come from each project's source or README where possible, and otherwise from
my own knowledge of the project.

---

## 1. Reference set

### 1.1 Sat Naing: terminal portfolio (React)
- **URL:** https://terminal.satnaing.dev (200) · source: https://github.com/satnaing/terminal-portfolio
- **Why it works:** This is the template most terminal portfolios copy. The welcome screen has
  three short lines separated by `----` rules: a versioned welcome, a link to the source,
  and "For a list of available commands, type `help`". A large ASCII name sits on the left and an
  ASCII illustration on the right. A separate, **smaller ASCII banner is swapped in on
  mobile** (`PreNameMobile`) instead of letting the big one wrap. It has six themes
  (dark, light, blue-matrix, espresso, green-goblin, ubuntu), Tab / Ctrl+I completion,
  arrow-key history, and a `gui` command that jumps to the normal site.
- **Steal:** **Use two banners, one for desktop and one for phones.** Never let ASCII art reflow. Pick
  which one to show with a media query, not by scaling the font down to 5px.

### 1.2 m4tt72 / Fathi: "Terminal" (Svelte)
- **URL:** https://term.fathi.me (200) · source: https://github.com/m4tt72/terminal (1.6k stars)
- **Why it works:** It treats the terminal as a small toy OS instead of a résumé in disguise:
  `todo`, `calc` (no `eval`), `convert`, `weather` (via wttr.in), `curl`. It has many themes using
  real terminal palettes (`theme ls`, `theme set gruvboxdark`), Tab completion,
  and Ctrl+L to clear.
- **Steal:** **`theme ls` previews each palette as a row of colour swatches** (`████` blocks in that
  theme's 8 ANSI colours), so the listing works as its own demo.

### 1.3 LiveTerm (Next.js template)
- **URL:** https://liveterm.vercel.app (200) · source: https://github.com/Cveinnt/LiveTerm
- **Why it works:** Everything lives in one `config.json`: name, ASCII art, socials, prompt
  user/host, résumé path, and light/dark colours. Commands are thin wrappers over that config. It has a
  plain, readable Gruvbox-ish look with no CRT gimmicks.
- **Steal:** **Keep content separate from the engine.** Every bio, project, and link lives in one
  data object (`content.js`), and commands only render it. That makes it cheap to keep in sync
  with the main site.

### 1.4 iamdhakrey: terminal-portfolio (Astro)
- **URL:** https://terminal-portfolio.iamdhakrey.dev (200) · source: https://github.com/iamdhakrey/terminal-portfolio
- **Why it works:** A modern take with themes (dark, light, matrix, cyberpunk), GitHub stats
  baked into static JSON at build time, a real blog with RSS, and SEO meta/sitemap. It shows that a terminal
  portfolio can still be indexable.
- **Steal:** **Prebake live-ish data into a static JSON file** (GitHub repos/stars, last commit)
  so commands like `projects` and `stats` feel live with zero runtime API calls.

### 1.5 Charm (charmbracelet): Lip Gloss, Gum, Glow, VHS, Huh
- **URL:** https://charm.sh redirects to https://charm.land (200) · https://github.com/charmbracelet/lipgloss (200)
- **Why it's the gold standard:** Their tagline is "We make the command line glamorous." Lip Gloss is
  CSS-like styling for terminals: **rounded borders (`╭─╮ │ ╰─╯`), padding of 1×2, one
  accent colour per panel, adaptive light/dark colours**, and pill-like inverted labels. Gum
  `style` exposes the same thing as flags (`--border rounded --padding "1 2"`). Huh
  forms show a single question with a highlighted current option and dim help text
  underneath (`↑/↓ navigate • enter select`). The common thread is lots of padding, few colours, a strong
  hierarchy of one bold accent plus dim grey, and **key-hint footers**.
- **Steal:** **The dim key-hint footer under interactive output.** For example:
  `↑↓ history · tab complete · ctrl+l clear · click any command`.

### 1.6 Warp
- **URL:** https://www.warp.dev (200)
- **Why it works:** **Blocks.** Each command and its output form one grouped unit with a
  subtle separator and hover affordances (copy, share). The input is a real text editor
  pinned at the bottom with inline ghost-text completion. Its marketing site uses `>_` glyphs
  and status legends drawn from block characters (`■ ▨ □`).
- **Steal:** **Render each command and its output as a block** (`<section>` with a 1px left
  rule in the accent colour on hover/focus). This also gives screen readers a natural
  unit to step through.

### 1.7 Ghostty
- **URL:** https://ghostty.org (200)
- **Why it works:** The homepage hero is an **animated ASCII-art ghost** rendered as text,
  not as video or canvas. It's sharp at every DPI, cheap to ship, and calm. Otherwise the site is
  restrained: dark, generous whitespace, documentation-grade typography.
- **Steal:** **A small frame-based ASCII animation for the boot card** (a few frames, plain
  text swapped on a timer, frozen when the user prefers reduced motion). For this portfolio that could be a
  copper flame, a spinning low-poly wireframe, or the initials "SV".

### 1.8 GitHub CLI (`gh`) and the Primer CLI guidelines
- **URL:** https://cli.github.com (200) · principles: https://primer.style/cli/getting-started/principles
- **Why it works:** This is the house style for clean CLI output. It uses **tables with a header line**,
  state shown in colour **and** in words (`✓ Checks passing`, `X 1 failing`), labels in
  parentheses and grey, names in bold, and footers like `Showing 3 of 12 open pull requests`.
  Dates are relative ("about 2 days ago"). Status glyphs are `✓ ✗ - !`.
- **Steal:** **Never encode state in colour alone.** Every coloured status also has a glyph or word,
  which handles both colour-blind visitors and screen readers.

### 1.9 clig.dev: Command Line Interface Guidelines
- **URL:** https://clig.dev (200)
- **Why it matters:** This is the rulebook. Show concise help by default and lead with examples.
  **Suggest the next command.** Rewrite errors for humans with a fix included. Use colour
  sparingly, put the most important line last, and give the user state they can inspect.
- **Steal:** **Every output ends with a dim "next" hint**, for example:
  `→ try: open 2 · projects --all · contact`. Unknown commands get a "did you mean"
  suggestion based on Levenshtein distance.

### 1.10 Vercel CLI output
- **URL:** https://vercel.com/docs/cli (200)
- **Why it works:** It uses the `▲` brand glyph as a prefix, step lines like `✓ Production: https://… [2s]`, and
  dim timings in square brackets at line ends. Output is monochrome with one brand mark, and the URLs are the hero.
- **Steal:** **Timing suffixes** such as `[12ms]` in dim text after commands that "load" something. It's a
  tiny touch of realism and costs nothing.

### 1.11 Starship prompt (and Oh My Posh)
- **URL:** https://starship.rs (200) · https://ohmyposh.dev (200)
- **Why it works:** It shows how to design a modern prompt: **segments** (dir, git branch, status, duration), each
  styled separately, a `❯` that turns red after an error, and a two-line prompt so input
  always starts at column 0.
- **Steal:** **The prompt glyph shows the previous command's status.** It is copper when the last command
  succeeded and muted red after an error. It is also the best way to show `cwd` without eating
  phone width.

### 1.12 jQuery Terminal and xterm.js (the libraries, and why not to use them)
- **URL:** https://terminal.jcubic.pl (200) · https://xtermjs.org (200)
- **What they teach:** jQuery Terminal has solved mobile keyboards, paste, and formatting
  (`[[b;#fff;]text]`). xterm.js is a real VT emulator that renders to canvas/WebGL, which is
  great for VS Code but **bad for this page**. Its canvas output is not selectable, findable, or
  screen-reader friendly, and it's heavy.
- **Steal:** **Keep output as real DOM text** (the current approach is right). Borrow
  jQuery Terminal's idea of a hidden-but-focusable `<textarea>`/`<input>` that
  receives the mobile keyboard, with a fake caret drawn on top.

**Also noted:**
- **Fig** (fig.io, now 503 and folded into Amazon Q) is the reference for the **autocomplete popover**: an
  IDE-style dropdown under the cursor with an icon, name, and dim description per row.
- **ertdfgcvb.xyz** (200) shows how expressive ASCII/text-mode art can be.
- **kavin.me, brandon.sh, and dev.potatoes.rocks** did not load, so I excluded them.
- **Hyper** (hyper.is, 200) is mostly relevant for its themed window chrome.

---

## 2. Diagnosis of the current page (quick read of `public/terminal/`)

- `help` is a 20-row wall of man-page text. It's alphabetised by implementation, not by what a
  visitor wants, and `nano`/`bash`/`sh` sit next to `projects`-level content. Non-technical visitors bounce.
- The input font-size is 14px. **iOS Safari zooms the page on focus for any input under 16px.**
- The banner falls back to `font-size: 5px` on small screens. That's illegible, so use a separate
  mobile banner instead (1.1).
- There's no click path. Everything requires typing.
- The good parts to keep: `role="log"` + `aria-live="polite"`, a real `<input>`, the
  `prefers-reduced-motion` block, DOM text output, `man`, `history`, and the sudo joke.

---

## 3. Design recommendation

### 3.1 The first 3 seconds
Show the content immediately. Make the boot **feel** alive without making anyone wait.

1. **0–300ms:** The page paints with the card already in the DOM, with no fake BIOS scroll. If you want
   a boot flourish, show 3–4 dim lines that reveal at 40ms apart
   (`mounting ~/shorya … ok [4ms]`), skipped entirely on reduced motion or on any keypress.
2. **The neofetch card** (the hero). It's a Charm-style rounded panel with the ASCII mark on the left and
   key/value pairs on the right:
   ```
   ╭──────────────────────────────────────────────────────────╮
   │   ▄▀▀▀▄       shorya@kolkata                             │
   │   █ SV █      ───────────────                            │
   │   ▀▄▄▄▀       role     student builder · web · 3d · ai│
   │               shell    portfolio-cli v2.0                │
   │               stack    ts · react · three.js · python    │
   │               status   ● open to work / collabs          │
   │               uptime   {computed from 2009-09-02}     │
   │               ████████████████  (palette swatches)       │
   ╰──────────────────────────────────────────────────────────╯
   ```
   Keys are dim, values are off-white, and the `●` dot is the only bright colour in the card. `uptime` is
   computed at runtime from 2009-09-02 (same as `src/utils/meta.js`), which is a live touch and keeps a literal age out of the static file.
3. **One line of instruction** under the card, written for humans:
   `New here? Click a command below, or type help.`
4. **Suggestion chips** (see 3.2), rendered inside the log as the first "output".
5. **The prompt is focused automatically on desktop only.** On touch devices, don't auto-focus,
   because that would pop the keyboard and hide the card.

### 3.2 Discovery for non-technical visitors
- **Clickable command chips** after the welcome and after `help`:
  `[ about ] [ projects ] [ skills ] [ contact ] [ resume ] [ gui ↗ ]`. These are real
  `<button>`s styled as `` `cmd` `` pills with a 1px copper border. Clicking one **types the command into
  the prompt and runs it**, so the visitor learns the syntax by watching.
- **Make every command name in output a link.** Any `` `projects` `` mentioned in text is a button
  that runs it. Project rows are clickable (`open 2`). URLs are real `<a>` tags.
- **Redesign `help`** as grouped and short, with the most useful commands first (clig.dev):
  ```
  ╭─ start here ───────────────────────────────╮
  │  about       who I am, in 20 seconds       │
  │  projects    things I've built  (try: open 1)
  │  contact     email, socials, call           │
  │  resume      download / view CV             │
  ╰────────────────────────────────────────────╯
   explore   skills · now · stack · uses · stats
   shell     ls · cd · cat · tree · clear · history · man <cmd>
   fun       theme · neofetch · sudo · coffee · matrix
   → tab completes · ↑↓ history · help --all for everything
  ```
  Put the full list behind `help --all`.
- **Ghost-text autosuggest** (Fish/Warp style): show the best completion in dim text after the caret.
  Pressing → or End accepts it, and so does tapping the ghost text on mobile. The source order is history first, then
  commands, then file names in the current directory.
- **Tab:** one match completes. Several matches print them in a single dim row, which is the bash behaviour.
  Double-Tab cycles through them.
- **Errors with a fix:**
  `command not found: projets. did you mean projects?` where `projects` is clickable.
- **History:** ↑/↓ steps through it, Ctrl+R does a reverse search (a nice touch for devs), and it's persisted
  in `localStorage` (wrapped in try/catch).
- **Escape hatch:** `gui` / `exit` and a persistent top-right `← site` link. Don't trap anyone.

### 3.3 Output design patterns (Charm + gh)
| Pattern | Use for | Spec |
|---|---|---|
| Rounded panel | neofetch, about, contact | `╭─ title ─╮`, padding 1×2, border in dim copper `#5a3a1a`, title in gold |
| Table | projects, skills | header in dim uppercase, 2-space gutters, `#` index column, status glyph column, max 5 columns |
| Key/value list | about, stack, now | keys right-padded to a shared width and dim, values off-white |
| Badges | tech tags, status | inverted pills: `▌ts▐` or CSS pills (`bg: #2a1d10; fg: gold`), 1ch horizontal padding |
| Tree | `tree`, `ls -R` | `├── └── │` in dim, folders in gold, files off-white |
| Progress/meter | `skills --bars` | `████████░░ 80%` (blocks in copper, rest dim) |
| Next-hint | after every content command | dim line starting `→`, with clickable commands |
| Block separator | every command | 1px rule `#1c1915`, plus a left accent bar on hover/focus |

Build boxes from **CSS borders on divs, not box-drawing characters** whenever the box has to
fit a variable width. Box-drawing characters break at narrow widths and when a CJK or emoji fallback font kicks in.
Use box-drawing glyphs only for fixed-width decorative headers.

**Colour hierarchy** (with contrast against `#0a0908`, computed for this doc and worth re-checking):
- `--fg` `#ece6da` for body text.
- `--dim` `#8a8378` (about 5.3:1) for keys, hints, and timings.
- `--accent` copper `#C57B2B` (about 5.9:1) for the prompt, borders on focus, and links.
- `--accent-2` gold `#D4983A` (about 7.9:1) for titles, folders, and the highlighted value.
- `--ok` `#8fbf7a` for the ✓ glyph, `--err` `#e07a5f` for the ✗ glyph and errors.
- `--rule` `#1c1915`.

The rule: **at most 2 accent colours per output block.** Body text is never coloured. Italic Instrument
Serif appears **once**, in the about panel's opening sentence, as a brand echo. Everything else is
JetBrains Mono.

**Typography and measure:**
- JetBrains Mono at 15px on desktop and 16px on mobile, with line-height 1.55 (terminals use about 1.2, but
  for reading prose 1.5+ wins).
- Output max-width `88ch`, left-aligned in a centred column with 24px padding.
- `font-variant-ligatures: none` for the prompt and commands, so `->` isn't turned into a ligature while typing.
- Use `tabular-nums` and preload only the 400 and 700 weights of the woff2 files, with `font-display: swap`.

**Prompt:** use two lines.
```
~/projects  main
❯ _
```
The first line holds the dim path segment (Starship style). The second line has a `❯` that is copper, or red after a
failed command. This leaves full width for input on phones.

### 3.4 Mobile
- **Input font-size of at least 16px** to stop iOS zooming the page on focus. Set `enterkeyhint="go"`,
  `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, and `inputmode="text"`.
- **A sticky chip bar above the keyboard** (`position: sticky; bottom: 0`, tracking
  `visualViewport` resize so it rides on top of the keyboard). It holds `help · about · projects · contact
  · ↑ · tab · clear`. The ↑ and tab buttons replace keys phones don't have.
- **Tap targets of at least 44px**, and chips scroll horizontally (`overflow-x: auto`, `scroll-snap`).
- **Tapping the log doesn't focus the input.** Only tapping the prompt row or the keyboard icon does. That way
  reading doesn't summon the keyboard.
- Use the mobile ASCII banner (no wider than 36 columns) and stack tables into key/value cards below 520px.
- Respect `env(safe-area-inset-*)` and use `100dvh`, not `100vh`.
- For the 3D-fallback case, the page should run on a cheap Android: **no canvas, no WebGL, and
  under about 60KB of JS+CSS before fonts**.

### 3.5 Accessibility
- Keep `role="log" aria-live="polite"`, but **announce a short summary per command**, not
  the ASCII art. Wrap decorative art in `aria-hidden="true"` and add an `sr-only` text equivalent
  ("Shoryavardhaan, student builder from Kolkata"; never a literal age, per project CLAUDE.md).
- Each command block is a `<section aria-label="output of projects">` that starts with a visually
  hidden `<h2>`, so screen-reader users can jump between outputs by heading.
- Tables are real `<table>`s and lists are real `<ul>`s, styled to look monospaced.
- Visible `:focus-visible` rings in copper, with 2px outline and 2px offset. Chips and links are reachable with Tab.
  **Tab inside the input completes commands. Esc then Tab moves focus out**, and this is documented in `help`.
  Alternatively, complete only when the input is non-empty.
- Under `prefers-reduced-motion`, skip the typing and boot animations, freeze the ASCII animation, and turn off
  caret blinking.
- `theme contrast` (and auto under `prefers-contrast: more`) switches to pure white on black,
  with a yellow accent and no dim text below 7:1.
- Light theme under `prefers-color-scheme: light`, warm paper `#f5efe4` with copper `#8a4f12`.
- Respect the colour-scheme meta. Don't rely on colour alone (see 1.8).
- `<noscript>` shows the full portfolio as plain HTML. It's also the SEO-indexable version.

### 3.6 Small delights that don't cost speed
- **Type out only the auto-run command** (the chip click), at about 18ms per character, with a cap of 300ms total.
  Output itself appears instantly. **Any keypress skips the animation.**
- **`theme`** with 4–5 palettes as CSS custom-property sets: `copper` (default), `phosphor`
  (green), `paper` (light), `contrast`, and `gruvbox`. `theme ls` shows swatches (1.2). The choice is persisted.
- **Live `uptime`, `date` in IST, and `weather kolkata`** (prebaked or skipped offline).
- **Easter eggs:** `sudo` (keep it), `sudo rm -rf /` (an animated "deleting" that reveals a joke),
  `coffee`/`chai` (ASCII chai cup, Kolkata-appropriate), `matrix` (a short copper rain that respects
  reduced motion), `hire me` (prints the contact panel with a "✓ excellent choice"), `vim`
  (the "how do I exit" joke), `exit` (bye animation, then go to the GUI), `ping`, `cowsay <msg>`,
  and `konami` as a keyboard sequence.
- **`3d`**: tries to load the 3D homepage, and if the device can't handle it, prints an
  honest note ("your device opted for the fast lane"), which turns the fallback into a feature.
- `[4ms]` dim timing suffixes (1.10), and a status-coloured `❯` (1.11).
- **`share`** copies a deep link (`/terminal/#projects`). Hash routing auto-runs that command
  on load, so links like `/terminal/#contact` work everywhere.

### 3.7 Command set
**Core (in the `help` "start here" group):** `about`, `projects` (table), `open <n|name>` (project
detail panel with links), `skills` (grouped badges, `--bars`), `contact` (panel with clickable
email, socials, and copy buttons), `resume` (view/download), `gui` (back to the site).

**Explore:** `now` (what I'm building this month), `stack` / `uses` (tools and hardware),
`stats` (prebaked GitHub numbers), `experience` / `timeline`, `blog` / `writing`, `socials`,
`neofetch`, `whoami`, `share`.

**Shell (for devs, kept working):** `ls [-la]`, `cd`, `pwd`, `cat`, `tree`, `grep <term>`
(searches all content, which is genuinely useful), `history`, `clear` / Ctrl+L, `man <cmd>`, `echo`,
`date`, `nano` (keep, but move to `help --all`).

**Clever:** `hire me`, `sudo hire shorya`, `ask <question>` (keyword-matched FAQ answers such as
"are you available", "what stack"; no AI call needed), `3d`, `theme`, `chai`,
`matrix`, `cowsay`, `exit`, `git log` (the portfolio's real milestones as fake commits:
`a1b2c3d  shipped vault model · 3 weeks ago`), and `curl shorya.dev/contact` (returns
the contact panel as pretty JSON).

---

## 4. Implementation notes (vanilla, no build)
- `content.js` holds the data (LiveTerm pattern). `engine.js` contains pure `(state, input) → {state, blocks}`.
  `ui.js` renders the blocks into DOM components (`panel()`, `table()`, `kv()`, `chips()`, `hint()`).
- Ideally `content.js` is **generated** from `src/data/projects.js` / `blog.js` by a small script
  (same pattern as `generate:projects`), which ends the hand-copied-snapshot drift the project
  CLAUDE.md warns about. Map the palette onto the site's existing CSS variables (`--cu`, `--text`, ...).
- Render with `textContent`/DOM nodes, never `innerHTML`, for anything the user typed (XSS).
- Fuzzy "did you mean" uses Levenshtein ≤ 2 against command names plus aliases
  (`project`, `work`, `cv`, `mail`, and so on). Aliases matter more than the fuzzy matching.
- Keep JetBrains Mono self-hosted (two woff2 weights) and subset Instrument Serif italic to
  Latin. Total budget is under 150KB including fonts.

## Sources
- https://terminal.satnaing.dev · https://github.com/satnaing/terminal-portfolio
- https://term.fathi.me · https://github.com/m4tt72/terminal
- https://liveterm.vercel.app · https://github.com/Cveinnt/LiveTerm
- https://terminal-portfolio.iamdhakrey.dev · https://github.com/iamdhakrey/terminal-portfolio
- https://charm.land · https://github.com/charmbracelet/lipgloss · https://github.com/charmbracelet/gum
- https://www.warp.dev · https://ghostty.org · https://cli.github.com
- https://primer.style/cli/getting-started/principles · https://clig.dev
- https://vercel.com/docs/cli · https://starship.rs · https://ohmyposh.dev
- https://terminal.jcubic.pl · https://xtermjs.org · https://ertdfgcvb.xyz · https://hyper.is
- https://dev.to/anomaly2009/few-amazing-terminal-style-portfolio-website-you-might-like-4pom
