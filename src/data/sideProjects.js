// Side projects — the not-so-serious stuff, filed in the second desk drawer
// of the 3D room. One index card each. `status`: 'shipped' | 'wip' | 'parked'.
// `line` is handwritten on the card, so keep it under ~30 characters; `desc`
// is the longer version shown in the side panel. `href` is the repo, `live`
// an optional demo.
export const SIDE_PROJECTS = [
  {
    name: 'Tackety',
    line: 'support tickets, by impact',
    desc: 'An open-source, self-hostable support engine that sits between customers and developers. A chatbot sorts each complaint into a bug or a service request, similar issues get clustered, and the team sees what to fix first, ranked by real impact instead of arrival time. Python, FastAPI and one SQLite file. The core engine runs today; clustering and the developer dashboard are still being built.',
    status: 'wip',
    href: 'https://github.com/vassu-v/Tackety',
  },
  {
    name: 'S.H.O.A.V.',
    line: 'a bodyguard for web agents',
    desc: 'An MCP server that gives any AI agent a real browser with a deterministic guard in the path. It stops clickjacking, dark patterns and hidden prompt injection before the agent acts on them. Built for Genesis Hackathon 2026, Track 03. Alpha, in active development.',
    status: 'wip',
    href: 'https://github.com/vassu-v/SHOAV',
    live: 'https://shoav.vercel.app/',
  },
  {
    name: 'Switchyard',
    line: 'one CLI for all my agents',
    desc: 'A small local daemon that keeps one live session per coding agent (agy, Claude Code, OpenCode, Codex). Spawn, watch, steer, interrupt and stop them from one CLI, an MCP bridge or a dashboard, with tier routing and a policy guard for risky commands.',
    status: 'wip',
    href: 'https://github.com/vassu-v/agent-supervisor-multiprovider_mcp',
  },
  {
    name: 'Delhi CM Dashboard',
    line: 'complaints, grouped by AI',
    desc: "A SarkarSathi spin-off built as a grievance command centre for the Delhi CM's office. Complaints across 14 districts and 11 categories on one heatmap, similar complaints merged into clusters, surge alerts against a rolling 3-week baseline, 7-day staleness flags, photo intake for handwritten letters, and an AI advisor that explains what it sees. FastAPI, SQLite, Gemini.",
    status: 'shipped',
    href: 'https://github.com/vassu-v/delhi-cm-dashboard-hn',
  },
  {
    name: 'FitHub',
    line: 'reps from a phone or a band',
    desc: "A gamified fitness tracker for students: no app install, no account. Count reps with a DIY ESP8266 + MPU-6050 band, or just your phone's motion sensor. Live rep counter over WebSocket, milestone badges against yourself, and a shareable workout card. Built in 3 hours.",
    status: 'shipped',
    href: 'https://github.com/vassu-v/FitHub',
  },
]
