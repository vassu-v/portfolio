"""
The actual "curl my site" feature - zero install required for the visitor,
since curl ships on every modern OS by default.

v4: raw-terminal feel per direct feedback - gradient banner (lolcat-style
per-character RGB interpolation, a real CLI technique), the banner
animates in character-by-character over a streamed/chunked response (curl
renders this live, no -N needed for a TTY), a boxed whoami panel with
richer info (current roles + a "more info" link), boxed commands list,
and role-based color elsewhere (rule dividers for projects/blog, matching
wttr.in/ancv.povel.dev-style resume tools).

Tradeoff, by design: ANSI escape codes render as colored text in any real
terminal, but show up as literal escape bytes if output is piped to a file
or a non-terminal consumer. Not detectable server-side, so this only ever
activates for requests already identified as curl via User-Agent - a
non-curl client gets the plain JSON fallback instead.

Deployed at: /  and /api/cli (see vercel.json - curl is routed here by
User-Agent, everyone else gets the real static site / web terminal).
"""

import re
import asyncio
import fastapi
from fastapi.responses import PlainTextResponse, JSONResponse, StreamingResponse

app = fastapi.FastAPI()

# ── ANSI helpers ─────────────────────────────────────────────────────────

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

# Role-based palette, not one accent doing everything:
COPPER = "\033[38;2;197;123;43m"   # headers/labels - matches var(--cu) on the real site
FG = "\033[38;2;192;202;245m"      # body text (Tokyo Night foreground, matches web terminal)
ACCENT = "\033[38;2;125;207;255m"  # links/URLs
MUTED = "\033[38;2;86;95;137m"     # rule characters, secondary text

GRADIENT_START = (197, 123, 43)    # copper
GRADIENT_END = (125, 207, 255)     # accent cyan

_ANSI_RE = re.compile(r"\033\[[0-9;]*m")

RULE_WIDTH = 64


def _visible_len(s: str) -> int:
    return len(_ANSI_RE.sub("", s))


def c(text: str, code: str) -> str:
    return f"{code}{text}{RESET}"


def gradient_char(ch: str, t: float) -> str:
    r = round(GRADIENT_START[0] + (GRADIENT_END[0] - GRADIENT_START[0]) * t)
    g = round(GRADIENT_START[1] + (GRADIENT_END[1] - GRADIENT_START[1]) * t)
    b = round(GRADIENT_START[2] + (GRADIENT_END[2] - GRADIENT_START[2]) * t)
    return f"\033[38;2;{r};{g};{b}m{ch}{RESET}"


def gradient_line(line: str, width: int) -> str:
    out = []
    for i, ch in enumerate(line):
        if ch == " ":
            out.append(ch)
            continue
        out.append(gradient_char(ch, i / max(width - 1, 1)))
    return "".join(out)


def rule(width: int = RULE_WIDTH) -> str:
    return c("─" * width, MUTED)


def rule_with_title(title: str, width: int = RULE_WIDTH) -> str:
    label = f" {title} "
    pad = width - _visible_len(label)
    left = pad // 2
    right = pad - left
    return c("─" * left, MUTED) + c(label, COPPER) + c("─" * right, MUTED)


def box(lines: list, title: str = None, width: int = None) -> str:
    inner_w = width or max((_visible_len(l) for l in lines), default=0)
    inner_w = max(inner_w, _visible_len(title) + 2 if title else 0)

    if title:
        title_disp = f" {title} "
        pad = inner_w + 2 - _visible_len(title_disp)
        left = pad // 2
        right = pad - left
        top = c("┌" + "─" * left, MUTED) + c(title_disp, COPPER) + c("─" * right + "┐", MUTED)
    else:
        top = c("┌" + "─" * (inner_w + 2) + "┐", MUTED)

    bottom = c("└" + "─" * (inner_w + 2) + "┘", MUTED)

    body = []
    for line in lines:
        fill = inner_w - _visible_len(line)
        body.append(c("│ ", MUTED) + line + " " * fill + c(" │", MUTED))

    return "\n".join([top] + body + [bottom])


# ── Banner: 3D block-shadow effect ────────────────────────────────────────
# Real block-drawing characters (█ solid, ░ light shade) instead of a flat
# '#' outline - the shade layer is offset one row/column down-right behind
# the solid layer, giving a genuine drop-shadow "3D" look purely through
# character placement (no terminal overlap tricks, works everywhere).

BANNER_FONT = {
    "S": ["#####", "#    ", "#####", "    #", "#####"],
    "H": ["#   #", "#   #", "#####", "#   #", "#   #"],
    "O": ["#####", "#   #", "#   #", "#   #", "#####"],
    "R": ["#####", "#   #", "#####", "#  # ", "#   #"],
    "Y": ["#   #", " # # ", "  #  ", "  #  ", "  #  "],
    "A": ["#####", "#   #", "#####", "#   #", "#   #"],
    "V": ["#   #", "#   #", "#   #", " # # ", "  #  "],
    "D": ["#### ", "#   #", "#   #", "#   #", "#### "],
    "N": ["#   #", "##  #", "# # #", "#  ##", "#   #"],
    " ": ["     ", "     ", "     ", "     ", "     "],
}
BANNER_WORD = "SHORYAVARDHAAN"
GLYPH_W = 5
GLYPH_H = 5
GLYPH_GAP = 1

SHADOW = "\033[38;2;74;46;18m"  # dim copper - the drop-shadow layer


def _banner_grid():
    total_cols = len(BANNER_WORD) * (GLYPH_W + GLYPH_GAP)
    main = set()
    col = 0
    for ch in BANNER_WORD:
        glyph = BANNER_FONT.get(ch, BANNER_FONT[" "])
        for r in range(GLYPH_H):
            for ci, gc in enumerate(glyph[r]):
                if gc == "#":
                    main.add((r, col + ci))
        col += GLYPH_W + GLYPH_GAP
    shadow = {(r + 1, c + 1) for (r, c) in main} - main
    grid_h, grid_w = GLYPH_H + 1, total_cols + 1
    return main, shadow, grid_h, grid_w


def banner_rows_plain() -> list:
    main, shadow, grid_h, grid_w = _banner_grid()
    rows = []
    for r in range(grid_h):
        row = "".join(
            "#" if (r, c) in main else ("." if (r, c) in shadow else " ")
            for c in range(grid_w)
        )
        rows.append(row.rstrip())
    return rows


def render_banner() -> str:
    main, shadow, grid_h, grid_w = _banner_grid()
    lines = []
    for r in range(grid_h):
        line = []
        for c_ in range(grid_w):
            if (r, c_) in main:
                line.append(gradient_char("█", c_ / max(grid_w - 1, 1)))
            elif (r, c_) in shadow:
                line.append(f"{SHADOW}░{RESET}")
            else:
                line.append(" ")
        lines.append("".join(line))
    return "\n".join(lines)


# ── ASCII portrait (compact v3 - replaces both earlier partial/oversized
# versions; small enough to sit next to text, README/neofetch-style) ─────

ASCII_PORTRAIT_LINES = [
    "                      .=***###*+**-.",
    "                   .+###%#*##*##+#%%%+",
    "                   *%##%%%%@@@%%@%#%%%*:",
    "                  +%@@@@%%%#++**#%%%%%#*.",
    "                  *%@%*=-:.....:--=+#%##.",
    "                  +@%=:...   .......:%%%:",
    "                  -@=-=+*#*=--=***=-:.*%:",
    "                  =#.-*####+:.=**%#*+:.*=:",
    "                  -=.  .::..  ....    .+=.",
    "                  .:.    :: ... --....:::",
    "                   .:---++-=***=-++==-::",
    "                    .-==+##=:::-*++=--:",
    "                     .=+=--==++=--=+=-",
    "                    .=-+*+-:....:=+++.*:",
    "                .+#*#= +***********+=+ ####+.",
    "               +*####  :++**###**+++*   *%##*-",
    "            .+*#####%.  :**++++++***   .%##%##*=.",
    "        .-***#%%%%%%#*.*=:++++++++= + -#%%%%#%%#**+:.",
    "      *####%%%%%%@%%%%%#-:: ----:.==#%%%%%@@@%%%%%%##*+.",
    "      #%%%%%%%%%%%%%@@%@%%#.  :.:-%%%@%@@%%%%%%%%%%%%%##-",
    "      %@@%%@%%%%%%%%%@%@@@@@@-:#@@@@@@%%%%%%%%%%%@%%@%%%#-",
]
ASCII_PORTRAIT = "\n".join(ASCII_PORTRAIT_LINES)


def two_column(left_lines: list, right_lines: list, gap: int = 3) -> str:
    """README/neofetch-style layout: art on the left, info on the right,
    line by line - not a separate full-width block above the text."""
    left_w = max((_visible_len(l) for l in left_lines), default=0)
    rows = max(len(left_lines), len(right_lines))
    out = []
    for i in range(rows):
        left = left_lines[i] if i < len(left_lines) else ""
        right = right_lines[i] if i < len(right_lines) else ""
        pad = left_w - _visible_len(left)
        out.append(left + " " * pad + " " * gap + right)
    return "\n".join(out)


# ── Real content ─────────────────────────────────────────────────────────

WHOAMI_PLAIN = (
    "Shoryavardhaan Gupta - 17, Kolkata, India.\n"
    "Student developer building AI applications, civic tech, and hardware projects.\n"
    "Currently: Kolkata Fork Lead @ Bits&Bytes, Youth Partner @ 4MQ.org.\n"
    "Also: Consultant @ 4MQ.org, Freelance UI/landing-page design.\n"
    "Published research: grounded/embodied AI planning, on ORCID.\n"
    "More info: https://shoryavardhaan.vercel.app/blog/why-i-build\n"
    "Portfolio: https://shoryavardhaan.vercel.app\n"
)

PROJECTS = [
    ("Buy4Chai", "self-hosted supporter page, Razorpay/UPI native", "https://github.com/vassu-v/Buy4Chai"),
    ("SarkarSathi", "AI co-pilot for municipal accountability in India", "https://github.com/vassu-v/india-innovates-CivicNTech"),
    ("Disaster-Resilient LiFi", "off-grid IR mesh, solar street lamps as nodes", "https://github.com/vassu-v/D-LiFi-Proto"),
    ("ChemX", "browser-controlled physical chemistry simulator", "https://github.com/vassu-v/ChemX_001"),
    ("Grounded Planning", "published AI planning research, written at 15", "https://zenodo.org/records/19513284"),
]

BLOG_POSTS = [
    ("Nobody told me to start. That was the point.", "https://shoryavardhaan.vercel.app/blog/why-i-build"),
    ("Why Indian developers can't get paid online, and how I fixed it", "https://shoryavardhaan.vercel.app/blog/building-buy4chai"),
    ("Markets don't get disrupted. They get aged out.", "https://shoryavardhaan.vercel.app/blog/markets-dont-get-disrupted"),
    ("Apple's been playing a different game since 2017", "https://shoryavardhaan.vercel.app/blog/apple-ai-decade"),
    ("Both groups are losing. Just differently.", "https://shoryavardhaan.vercel.app/blog/both-groups-are-losing"),
    ('Why "needs vs. wants" is the wrong framework', "https://shoryavardhaan.vercel.app/blog/hardware-failure"),
]

# NOTE: base cal.com link only, per direct feedback - not the 30-min
# overlay-specific URL used on the main site's "book a call" CTA.
CONTACT_PLAIN = (
    "Reach out any time: shoryavardhaans2@gmail.com\n"
    "Calendar: https://cal.com/shoryavardhaan\n"
)


# ── Rendered (TUI) bodies ──────────────────────────────────────────────────

def render_whoami() -> str:
    info = [
        c("Shoryavardhaan Gupta", BOLD + FG) + c("  -  17, Kolkata, India", MUTED),
        "11th grade, South Point High School. Student developer building",
        "AI applications, civic tech, and hardware projects.",
        "",
        c("Currently   ", COPPER) + "Kolkata Fork Lead @ Bits&Bytes",
        c("            ", COPPER) + "Youth Partner @ 4MQ.org",
        c("Also        ", COPPER) + "Consultant @ 4MQ.org",
        c("            ", COPPER) + "Freelance UI / landing-page design",
        c("Research    ", COPPER) + "Grounded/embodied AI planning - published on",
        c("            ", COPPER) + "Zenodo, written at 15. ORCID 0009-0009-1370-5230",
        c("Recognition ", COPPER) + "India Innovates 2026 - Top 1,000 / 26,000+ entries",
        c("            ", COPPER) + "CBSE Regional Science Exhibition 2025-26",
        "",
        c("GitHub      ", COPPER) + c("https://github.com/vassu-v", ACCENT),
        c("LinkedIn    ", COPPER) + c("https://www.linkedin.com/in/shoryavardhaan", ACCENT),
        c("More info   ", COPPER) + c("https://shoryavardhaan.vercel.app/blog/why-i-build", ACCENT),
        c("Portfolio   ", COPPER) + c("https://shoryavardhaan.vercel.app", ACCENT),
    ]
    art = [c(line, COPPER) for line in ASCII_PORTRAIT_LINES]
    return two_column(art, info)


def render_commands(host: str) -> str:
    rows = [
        (f"curl {host}", "this screen"),
        (f"curl {host}/whoami", "who this is"),
        (f"curl {host}/projects", "project list"),
        (f"curl {host}/blog", "writing"),
        (f"curl {host}/contact", "get in touch"),
    ]
    w = max(len(a) for a, _ in rows)
    lines = []
    for a, b in rows:
        lines.append(c(a.ljust(w), ACCENT) + "   " + c(b, MUTED))
    return box(lines, title="commands")


def render_projects() -> str:
    lines = [rule_with_title("projects"), ""]
    for i, (name, desc, url) in enumerate(PROJECTS):
        lines.append(c(name, BOLD + FG))
        lines.append(c(f"  {desc}", MUTED))
        lines.append("  " + c(url, ACCENT))
        if i != len(PROJECTS) - 1:
            lines.append("")
    return "\n".join(lines)


def render_blog() -> str:
    lines = [rule_with_title("blog"), ""]
    for i, (title, url) in enumerate(BLOG_POSTS, start=1):
        lines.append(c(f"{i}. ", COPPER) + c(title, BOLD + FG))
        lines.append("   " + c(url, ACCENT))
        if i != len(BLOG_POSTS):
            lines.append("")
    return "\n".join(lines)


def render_contact() -> str:
    lines = [
        rule_with_title("contact"),
        "",
        c("Email     ", COPPER) + c("shoryavardhaans2@gmail.com", ACCENT),
        c("Calendar  ", COPPER) + c("https://cal.com/shoryavardhaan", ACCENT),
    ]
    return "\n".join(lines)


def render_root_static(host: str) -> str:
    """Non-animated fallback (used for the JSON/non-curl path's reference
    URL and available for testing) - the live curl path streams instead,
    see stream_root()."""
    return "\n".join([
        "",
        render_banner(),
        "",
        render_whoami(),
        "",
        render_commands(host),
        "",
        c("Full site: ", MUTED) + c("https://shoryavardhaan.vercel.app", ACCENT),
        "",
    ])


async def stream_root(host: str):
    """Animates the name in as it streams to curl - a real chunked HTTP
    response, not a trick; curl renders each chunk as it arrives. Streamed
    row-by-row (not character-by-character): each yield is a real network
    flush on Vercel's serverless runtime, and hundreds of tiny per-char
    chunks measured ~6s end-to-end in practice - row-sized chunks with a
    short pause between rows reads as animated without the latency cost."""
    yield "\n"
    main, shadow, grid_h, grid_w = _banner_grid()
    for r in range(grid_h):
        line = []
        for c_ in range(grid_w):
            if (r, c_) in main:
                line.append(gradient_char("█", c_ / max(grid_w - 1, 1)))
            elif (r, c_) in shadow:
                line.append(f"{SHADOW}░{RESET}")
            else:
                line.append(" ")
        yield "".join(line).rstrip() + "\n"
        await asyncio.sleep(0.09)
    yield "\n"
    yield render_whoami() + "\n\n"
    yield render_commands(host) + "\n\n"
    yield c("Full site: ", MUTED) + c("https://shoryavardhaan.vercel.app", ACCENT) + "\n\n"


# ── Routing ──────────────────────────────────────────────────────────────

def is_curl(request: fastapi.Request) -> bool:
    ua = request.headers.get("user-agent", "")
    return "curl" in ua.lower()


# NOTE: with vercel.json's legacy `routes` format, `dest` selects which
# serverless function handles the request, but the ASGI scope's path stays
# the ORIGINAL public path (confirmed against the real deployment) - so
# routes here must match the public paths, not the function's own file path.
# /api/cli itself stays reachable directly too, as a manual fallback.

@app.get("/")
@app.get("/api/cli")
async def cli_root(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({
            "hint": "this endpoint is meant for curl - try: curl " + str(request.url)
        })
    host = f"{request.url.scheme}://{request.url.netloc}"
    return StreamingResponse(stream_root(host), media_type="text/plain")


@app.get("/whoami")
@app.get("/api/cli/whoami")
async def cli_whoami(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"whoami": WHOAMI_PLAIN.strip()})
    return PlainTextResponse("\n" + render_whoami() + "\n")


@app.get("/projects")
@app.get("/api/cli/projects")
async def cli_projects(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"projects": [{"name": n, "desc": d, "url": u} for n, d, u in PROJECTS]})
    return PlainTextResponse("\n" + render_projects() + "\n")


@app.get("/blog")
@app.get("/api/cli/blog")
async def cli_blog(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"blog": [{"title": t, "url": u} for t, u in BLOG_POSTS]})
    return PlainTextResponse("\n" + render_blog() + "\n")


@app.get("/contact")
@app.get("/api/cli/contact")
async def cli_contact(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"contact": CONTACT_PLAIN.strip().split("\n")})
    return PlainTextResponse("\n" + render_contact() + "\n")
