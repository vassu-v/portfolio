"""
`curl shoryavardhaan.vercel.app` — the zero-install CLI version of the site.

v5 (stripped down): same look and same data as the web terminal at
/terminal/ — a screenfetch-style card, pacman-style `::` headers, cyan keys,
portrait blue (#84D0E8) with turban-orange (#F07A1A) accents.

Content is NOT hand-copied any more: it reads api/cli_data.json, generated
from src/data (projects, blog), Experience.jsx and corkData.js by
`npm run generate:terminal` (the same run that writes the web terminal's
data). Age is computed from the stored birth date — never a literal.

vercel.json routes requests whose User-Agent contains "curl" here; everyone
else gets the real site. Non-curl clients hitting these paths get JSON.
`?plain` strips ANSI colour (for piping into a file).
"""

import json
import re
import textwrap
from datetime import date
from pathlib import Path

import fastapi
from fastapi.responses import JSONResponse, PlainTextResponse

app = fastapi.FastAPI()
DATA = json.loads((Path(__file__).parent / "cli_data.json").read_text(encoding="utf-8"))
SITE = "https://shoryavardhaan.vercel.app"
WIDTH = 72

# ── palette (matches /terminal/ "shorya" theme) ──────────────────────────
RESET, BOLD = "\033[0m", "\033[1m"
BLUE = "\033[38;2;132;208;232m"
ORANGE = "\033[38;2;240;122;26m"
FG = "\033[38;2;213;227;234m"
DIM = "\033[38;2;117;144;160m"
FAINT = "\033[38;2;61;80;91m"
OK = "\033[38;2;158;206;106m"
_ANSI = re.compile(r"\033\[[0-9;]*m")


def c(text, *codes):
    return "".join(codes) + str(text) + RESET


def age():
    b = date.fromisoformat(DATA.get("birth", "2009-09-02"))
    t = date.today()
    return t.year - b.year - ((t.month, t.day) < (b.month, b.day))


def header(title):
    return c("::", BOLD, ORANGE) + " " + c(title, BOLD, FG)


def sub(title):
    return c("==>", BOLD, BLUE) + " " + c(title, BOLD, FG)


def wrap(text, indent=""):
    return "\n".join(textwrap.fill(p, WIDTH, initial_indent=indent, subsequent_indent=indent)
                     for p in str(text or "").split("\n") if p.strip())


def kv(rows, key_w=10):
    return "\n".join(c(f"{k}:".ljust(key_w), BOLD, BLUE) + " " + v for k, v in rows)


def footer(*paths):
    host = SITE.split("//")[1]
    return "\n" + "\n".join(c("next  ", DIM) + c(f"curl {host}{p}", BLUE) for p in paths)


# ── screens ──────────────────────────────────────────────────────────────

LOGO = [
    "          /\\          ",
    "         /oo\\         ",
    "        /oooo\\        ",
    "       /++++++\\       ",
    "      /--------\\      ",
    "     /ssssssssss\\     ",
    "    /ssss    ssss\\    ",
    "   /ooo        ooo\\   ",
]


def screen_home():
    d = DATA
    info = [
        c("visitor", BOLD, BLUE) + c("@", FG) + c("shorya", BOLD, BLUE),
        c("─" * 22, FAINT),
        c("OS:", BOLD, BLUE) + " ShoryaOS (arch, btw)",
        c("Kernel:", BOLD, BLUE) + f" {age()}.0-builder",
        c("Location:", BOLD, BLUE) + " Kolkata, IN",
        c("Packages:", BOLD, BLUE) + f" {len(d['projects'])} projects, {len(d['side'])} side, {len(d['posts'])} essays",
        c("Now:", BOLD, BLUE) + " Bits&Bytes · 4MQ.org",
        c("Status:", BOLD, BLUE) + " " + c("open to collab", OK),
    ]
    art = [c(line, BOLD, ORANGE if i == 4 else BLUE) for i, line in enumerate(LOGO)]
    lines = [(art[i] if i < len(art) else " " * 22) + "  " + (info[i] if i < len(info) else "") for i in range(max(len(art), len(info)))]
    intro = wrap(f"Shoryavardhaan Gupta, {age()}, builds civic tech, hardware and AI from Kolkata. "
                 "I don't wait to be qualified: I ship things, see what breaks, and figure it out from there.")
    return "\n".join(["", *lines, "", c(intro, FG), "", screen_help(short=True)])


COMMANDS = [
    ("", "this card"),
    ("/about", "who I am, in a paragraph"),
    ("/projects", "things I've built"),
    ("/projects/<name>", "one project, e.g. /projects/buy4chai"),
    ("/side", "side projects, e.g. /side/1"),
    ("/work", "roles & where I've been"),
    ("/blog", "essays"),
    ("/blog/<n>", "read one, e.g. /blog/1"),
    ("/wins", "awards, receipts, firsts"),
    ("/skills", "the toolbox"),
    ("/contact", "every way to say hi"),
    ("/help", "this list"),
]


def screen_help(short=False):
    host = SITE.split("//")[1]
    rows = [c(p.ljust(20), BOLD, BLUE) + c(desc, DIM) for p, desc in COMMANDS[1:]]
    return "\n".join([header("commands") + c(f"  curl {host}<path>", DIM), *rows, "",
                      c("add ?plain to strip colour, e.g. curl …/work?plain > work.txt", DIM),
                      c("full web version: ", DIM) + c(f"{SITE}/terminal/", BLUE)])


def screen_projects():
    out = ["", header("projects")]
    for i, p in enumerate(DATA["projects"], 1):
        out.append(c(f"{i:02d}", FAINT) + "  " + c(p["name"], BOLD, BLUE) + c(f"  {p.get('period') or ''}", DIM))
        out.append(wrap(p["tagline"], "    "))
        out.append(c(f"    curl {SITE.split('//')[1]}/projects/{p['slug']}", FAINT))
    return "\n".join(out)


def find_project(key):
    key = key.lower()
    for i, p in enumerate(DATA["projects"], 1):
        if key in (p["slug"], str(i)) or p["slug"].startswith(key) or p["name"].lower().startswith(key):
            return p
    return None


def screen_project(p):
    out = ["", header(p["name"]) + c(f"  · {p.get('period') or ''}", DIM), wrap(p["tagline"]), ""]
    out.append(" ".join(c("[", FAINT) + c(t, ORANGE) + c("]", FAINT) for t in p.get("tags", [])))
    out += ["", sub("problem"), wrap(p.get("problem")), "", sub("solution"), wrap(p.get("solution"))]
    if p.get("how"):
        out += ["", sub("how it works")]
        out += [textwrap.fill(f"- {h['label']}: {h['text']}", WIDTH, initial_indent="  ", subsequent_indent="    ") for h in p["how"]]
    if p.get("impact"):
        out += ["", sub("impact")] + ["  " + c(m["val"].ljust(6), BOLD, OK) + " " + c(m["label"], DIM) for m in p["impact"]]
    links = [("case study", f"{SITE}/project/{p['slug']}")]
    if p.get("github"):
        links.insert(0, ("source", p["github"]))
    if p.get("live"):
        links.insert(1, ("live", p["live"]))
    out += ["", kv([(k, c(v, BLUE)) for k, v in links], key_w=12)]
    return "\n".join(out)


def screen_work():
    out = ["", header("work")]
    for e in DATA["work"]:
        dot = c("●", OK) if e.get("live") else c("○", FAINT)
        out.append(f"{dot} {c(e['org'], BOLD, BLUE)} {c('— ' + e['role'], FG)}  {c(e['period'], DIM)}")
        out.append(wrap(e["desc"], "  "))
        for x in e.get("extra") or []:
            out.append(c(f"  + {x['title']} · {x['period']} · {x['type']}", DIM))
        out.append("")
    out.append(c("● = current", DIM))
    return "\n".join(out)


def screen_blog():
    out = ["", header("the log")]
    for i, p in enumerate(DATA["posts"], 1):
        out.append(c(f"{i:02d}", FAINT) + "  " + c(p["title"], BOLD, BLUE))
        out.append(c(f"    {p.get('category') or ''} · {p['date']} · {p.get('readTime') or ''}", DIM))
        out.append(c(f"    curl {SITE.split('//')[1]}/blog/{i}", FAINT))
    return "\n".join(out)


def find(items, key, field):
    key = key.lower()
    for i, x in enumerate(items, 1):
        if key in (x.get("slug", ""), str(i)) or (x.get("slug") or "").startswith(key) or str(x[field]).lower().startswith(key):
            return x
    return None


def screen_post(p):
    out = ["", header(p["title"]), c(f"{p.get('category') or ''} · {p['date']} · {p.get('readTime') or ''}", DIM), "",
           c(wrap(p.get("subtitle")), BOLD, FG), "", wrap(p.get("lede"))]
    if p.get("quote"):
        out += ["", wrap(p["quote"], c("  │ ", ORANGE))]
    out += ["", kv([("keep reading", c(p.get("external") or f"{SITE}/blog/{p['slug']}", BLUE))], key_w=14)]
    return "\n".join(out)


def screen_about():
    a = DATA["about"]
    return "\n".join(["", header("about.md"), c(wrap(a["lead"]), BOLD, FG), "",
                      wrap(f"Shoryavardhaan Gupta, {age()}, Kolkata. " + a["body"][0]),
                      *["\n" + wrap(p) for p in a["body"][1:]]])


def screen_wins():
    out = ["", header("wins & receipts")]
    for w in DATA["wins"]:
        out.append(c("★ ", ORANGE) + c(w["title"], BOLD, BLUE) + (c(f"  {w['sub']}", DIM) if w.get("sub") else ""))
        out.append(wrap(w["text"], "  "))
        if w.get("project"):
            out.append(c(f"  curl {SITE.split('//')[1]}/projects/{w['project']}", FAINT))
        out.append("")
    return "\n".join(out)


def screen_skills():
    # wrap by visible width: textwrap would count (and split) the ANSI codes
    lines, cur, w = [], [], 0
    for s in DATA["skills"]:
        if cur and w + len(s) + 4 > WIDTH:
            lines.append("  ".join(cur))
            cur, w = [], 0
        cur.append(c("[", FAINT) + c(s, ORANGE) + c("]", FAINT))
        w += len(s) + 4
    lines.append("  ".join(cur))
    return "\n".join(["", header("toolbox"), *lines])


STATUS = {"shipped": "shipped", "wip": "on it", "parked": "parked"}


def screen_side_list():
    out = ["", header("side projects") + c("  the not-so-serious drawer", DIM)]
    for i, s in enumerate(DATA["side"], 1):
        out.append(c(f"{i:02d}", FAINT) + "  " + c(s["name"], BOLD, BLUE) + c(f"  {STATUS.get(s['status'], s['status'])}", DIM))
        out.append(wrap(s["line"], "    "))
        out.append(c(f"    curl {SITE.split('//')[1]}/side/{i}", FAINT))
    return "\n".join(out)


def screen_side(s):
    out = ["", header(s["name"]) + c(f"  · {STATUS.get(s['status'], s['status'])}", DIM), c(wrap(s["line"]), BOLD, FG), "", wrap(s["desc"])]
    links = [(k, s[k]) for k in ("github", "live") if s.get(k)]
    if links:
        out += ["", kv([(k, c(v, BLUE)) for k, v in links])]
    return "\n".join(out)


CONTACT = [
    ("email", "shoryavardhaans2@gmail.com"),
    ("call", "https://cal.com/shoryavardhaan/30min"),
    ("linkedin", "https://www.linkedin.com/in/shoryavardhaan"),
    ("github", "https://github.com/vassu-v"),
    ("x", "https://x.com/shoryavardhaan"),
]


def screen_contact():
    return "\n".join(["", header("contact"), c("Want to build something together?", BOLD, FG), "",
                      kv([(k, c(v, BLUE)) for k, v in CONTACT])])


# ── routing ──────────────────────────────────────────────────────────────

def is_curl(request):
    return "curl" in request.headers.get("user-agent", "").lower()


def respond(request, body, nexts=("/projects", "/contact")):
    text = body + "\n" + footer(*nexts) + "\n\n"
    if "plain" in request.query_params:
        text = _ANSI.sub("", text)
    return PlainTextResponse(text)


# NOTE: with vercel.json's legacy `routes`, `dest` picks this function but the
# ASGI path stays the ORIGINAL public path — so routes match public paths.
# /api/cli/* stays reachable directly as a manual fallback.

@app.get("/")
@app.get("/whoami")
@app.get("/api/cli")
async def home(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"hint": "this endpoint is for curl — try: curl " + str(request.url)})
    return respond(request, screen_home(), ("/projects", "/work"))


@app.get("/help")
@app.get("/api/cli/help")
async def help_(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"commands": [p or "/" for p, _ in COMMANDS]})
    return respond(request, "\n" + screen_help(), ("/projects",))


@app.get("/projects")
@app.get("/api/cli/projects")
async def projects(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"projects": [{"name": p["name"], "tagline": p["tagline"], "url": f"{SITE}/project/{p['slug']}"} for p in DATA["projects"]]})
    return respond(request, screen_projects(), ("/projects/1", "/work"))


@app.get("/projects/{key}")
@app.get("/api/cli/projects/{key}")
async def project(request: fastapi.Request, key: str):
    p = find_project(key)
    if not is_curl(request):
        return JSONResponse(p or {"error": "no such project"}, status_code=200 if p else 404)
    if not p:
        return respond(request, "\n" + c(f"no project matching '{key}'", ORANGE) + "\n\n" + screen_projects(), ("/projects",))
    return respond(request, screen_project(p), ("/projects", "/contact"))


@app.get("/work")
@app.get("/api/cli/work")
async def work(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"work": DATA["work"]})
    return respond(request, screen_work(), ("/projects", "/contact"))


@app.get("/blog")
@app.get("/api/cli/blog")
async def blog(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"blog": [{"title": p["title"], "url": f"{SITE}/blog/{p['slug']}"} for p in DATA["posts"]]})
    return respond(request, screen_blog(), ("/projects", "/contact"))


@app.get("/blog/{key}")
@app.get("/api/cli/blog/{key}")
async def post(request: fastapi.Request, key: str):
    p = find(DATA["posts"], key, "title")
    if not is_curl(request):
        return JSONResponse(p or {"error": "no such post"}, status_code=200 if p else 404)
    if not p:
        return respond(request, "\n" + c(f"no post matching '{key}'", ORANGE) + "\n\n" + screen_blog(), ("/blog",))
    return respond(request, screen_post(p), ("/blog", "/contact"))


@app.get("/about")
@app.get("/api/cli/about")
async def about(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"about": DATA["about"]})
    return respond(request, screen_about(), ("/projects", "/work"))


@app.get("/wins")
@app.get("/api/cli/wins")
async def wins(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"wins": DATA["wins"]})
    return respond(request, screen_wins(), ("/projects", "/contact"))


@app.get("/skills")
@app.get("/api/cli/skills")
async def skills(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"skills": DATA["skills"]})
    return respond(request, screen_skills(), ("/projects", "/contact"))


@app.get("/side")
@app.get("/api/cli/side")
async def side_list(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"side": DATA["side"]})
    return respond(request, screen_side_list(), ("/side/1", "/projects"))


@app.get("/side/{key}")
@app.get("/api/cli/side/{key}")
async def side(request: fastapi.Request, key: str):
    s = find(DATA["side"], key, "name")
    if not is_curl(request):
        return JSONResponse(s or {"error": "no such side project"}, status_code=200 if s else 404)
    if not s:
        return respond(request, "\n" + c(f"no side project matching '{key}'", ORANGE) + "\n\n" + screen_side_list(), ("/side",))
    return respond(request, screen_side(s), ("/side", "/contact"))


@app.get("/contact")
@app.get("/api/cli/contact")
async def contact(request: fastapi.Request):
    if not is_curl(request):
        return JSONResponse({"contact": dict(CONTACT)})
    return respond(request, screen_contact(), ("/projects",))
