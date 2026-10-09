import { EXP } from '../../components/Experience'

// Everything pinned to the corkboard. Positions are board-local metres
// (board centre = 0,0; x ∈ ±0.75, y ∈ ±0.475), r = tilt in radians.
// Top half: roles as a left → right timeline on one string. Bottom half:
// wins & receipts in two loose rows.
// `support` = the material that pulls up beside an item when it's clicked.

export const CAL = 'https://cal.com/shoryavardhaan/30min?overlayCalendar=true'

const expById = Object.fromEntries(EXP.map(e => [e.org, e]))
const skillsNote = e => ({ kind: 'note', color: '#f7e27a', title: 'skills', lines: e.skills })

const EXP_SUPPORT = {
  'Bits&Bytes': [
    { kind: 'note', color: '#bfe3c0', title: 'the plan', lines: ['Eastern India chapter', 'hackathons · builder events', 'core team formation', 'launched Apr 2026'] },
    { kind: 'link', title: 'gobitsnbytes.org', sub: 'the community', href: 'https://gobitsnbytes.org/' },
  ],
  '4MQ.org': [
    ...(expById['4MQ.org']?.extra || []).map(x => ({ kind: 'card', title: x.title, sub: x.period, foot: x.type })),
    { kind: 'link', title: '4mq.org', sub: 'money & behaviour', href: 'https://4mq.org/' },
  ],
  'Beyond Rote': [
    { kind: 'stat', big: '50+', small: 'research questions fielded', sub: 'from 120+ students' },
  ],
  Utsavy: [
    { kind: 'stat', big: '+20%', small: 'inquiry submissions', sub: 'after the custom designs' },
  ],
  Freelance: [
    { kind: 'link', title: 'book a call', sub: 'cal.com/shoryavardhaan', href: CAL },
  ],
}

export const CHRONO = ['Utsavy', 'Beyond Rote', 'Freelance', '4MQ.org', 'Bits&Bytes']
const TILT = [-0.03, 0.025, -0.015, 0.03, -0.02]
// generous spacing, and the right-hand columns left free: the board is
// sized for the roles and wins still to come
const EXP_POS = Object.fromEntries(CHRONO.map((o, i) => [o, [-0.6 + i * 0.235, 0.215 + (i % 2 ? -0.014 : 0.008), TILT[i]]]))
const WIN_ROWS = [-0.08, -0.3]
const winPos = (i, r) => [-0.6 + (i % 5) * 0.225 + (Math.floor(i / 5) ? 0.04 : 0), WIN_ROWS[Math.floor(i / 5)] + (i % 2 ? 0.012 : -0.008), r]
const hireNote = { kind: 'note', color: '#f4a261', title: 'hire me →', lines: ['UI & landing pages', 'built fast, built right', 'book a 30-min call'], href: CAL, big: true }

const exp = EXP.map(e => ({
  id: 'exp-' + e.org,
  kind: 'expcard',
  exp: e,
  pos: EXP_POS[e.org] || [0, 0, 0],
  label: `${e.org} — ${e.primaryRole}`,
  panel: { title: e.org, sub: `${e.primaryRole} · ${e.period}`, text: e.desc, cta: e.cta },
  // freelance gets a "hire me" in place of the skills list
  support: [...(EXP_SUPPORT[e.org] || []), e.org === 'Freelance' ? hireNote : skillsNote(e)],
}))

const wins = [
  {
    id: 'win-ii', kind: 'polaroid', src: '/projects/sarkarsathi_cm.jpg', cap: 'india innovates', pos: winPos(0, 0.05),
    label: 'India Innovates 2026 — National Semi-Finalist',
    panel: { title: 'National Semi-Finalist', sub: 'India Innovates 2026', text: 'SarkarSathi. Top 1,000 from 26,000+ entries. Sole technical lead on a 5-person team during board exams. Media coverage.', project: 'sarkarsathi' },
    support: [
      { kind: 'stat', big: 'Top 1k', small: 'of 26,000+ entries', sub: 'India Innovates 2026' },
      { kind: 'note', color: '#f4b98a', title: 'built during boards', lines: ['sole technical lead', '5-person remote team', 'media coverage'] },
      { kind: 'link', title: 'SarkarSathi →', sub: 'the project', project: 'sarkarsathi' },
    ],
  },
  {
    id: 'win-social', kind: 'note', color: '#bfe3c0', title: 'followers', lines: ['1,300+ LinkedIn', '110+ Instagram', '8 months, no hacks'], pos: winPos(1, -0.04),
    label: 'LinkedIn + Instagram',
    panel: { title: 'Followers', sub: 'LinkedIn + Instagram', text: '8 months. No algorithm chasing. One post hit 15,000+ impressions.' },
    support: [
      { kind: 'stat', big: '1,300+', small: 'LinkedIn followers' },
      { kind: 'stat', big: '15k+', small: 'impressions, one post' },
    ],
  },
  {
    id: 'win-pay', kind: 'receipt', lines: ['INTL PAYMENTS', '— — — — — —', 'TOTAL   $300', 'FROM    KOLKATA', 'VIA     BUY4CHAI'], pos: winPos(2, 0.04),
    label: '$300 in international payments',
    panel: { title: 'From Kolkata.', sub: 'International payments processed', text: 'The first international payment to land in Kolkata, through a supporter page built for exactly the developers Stripe locks out.', project: 'buy4chai' },
    support: [
      { kind: 'stat', big: '$300', small: 'processed internationally' },
      { kind: 'link', title: 'Buy4Chai →', sub: 'how it got paid', project: 'buy4chai' },
    ],
  },
  {
    id: 'win-qq', kind: 'polaroid', src: '/dbpc.jpg', cap: "quantum qubit '25", pos: winPos(3, -0.05),
    label: "Quantum Qubit '25 — 3rd Place",
    panel: { title: '3rd Place', sub: "Quantum Qubit'25", text: 'Built real-world systems across CS and electronics under competition constraints.' },
    support: [
      { kind: 'polaroid', src: '/solder.jpeg', cap: 'the build' },
      { kind: 'stat', big: '3rd', small: "Quantum Qubit '25", sub: 'Don Bosco, Kolkata' },
    ],
  },
  {
    id: 'win-zen', kind: 'polaroid', src: '/preprint.jpg', cap: 'published · zenodo', pos: winPos(4, -0.04),
    label: 'Published research preprint',
    panel: { title: 'Published Research Preprint', sub: 'Zenodo · Jan 2026', text: 'Object Commitment as a Diagnostic Pressure Point in Grounded Planning. Exposing failure modes that high success rates hide.', project: 'planning-research' },
    support: [
      { kind: 'note', color: '#f7e27a', title: 'the finding', lines: ['high success rates', 'can hide brittle', 'reasoning'] },
      { kind: 'link', title: 'the research →', sub: 'grounded planning', project: 'planning-research' },
    ],
  },
  {
    id: 'win-gc', kind: 'polaroid', src: '/google.jpeg', cap: 'google cloud · 14', pos: winPos(5, 0.06),
    label: 'Google Cloud — Ready Facilitator',
    panel: { title: 'Ready Facilitator', sub: 'Google Cloud · Age 14', text: 'Recognized for active participation and winning.' },
    support: [{ kind: 'stat', big: '14', small: 'years old at the time' }],
  },
  {
    id: 'win-syi', kind: 'polaroid', src: '/syi.webp', cap: 'top 500 · india', pos: winPos(6, -0.03),
    label: 'ThinkStartup — Top 500 National',
    panel: { title: 'Top 500 National', sub: 'ThinkStartup · 2025', text: 'Youth Ideathon. Top 2,000 → Top 500 with PickedIn.' },
    support: [{ kind: 'stat', big: 'Top 500', small: 'from the top 2,000', sub: 'with PickedIn' }],
  },
  {
    id: 'win-kdp', kind: 'polaroid', src: '/amzn.jpeg', cap: 'published · 14', pos: winPos(7, 0.05),
    label: 'Amazon KDP — Published Author',
    panel: { title: 'Published Author', sub: 'Amazon KDP · Age 14', text: "Wrote, formatted, designed the cover, navigated Amazon's publishing at 14. No AI. Zero sales. Redesigned it a year later. Then sold copies. The lesson wasn't the book. It was finishing." },
    support: [{ kind: 'note', color: '#f4b98a', title: 'the lesson', lines: ["it wasn't the book.", 'it was finishing.'] }],
  },
]

const bits = [
  {
    id: 'note-quote', kind: 'note', color: '#f7e27a', title: '', lines: ["I don't wait to be", 'qualified. I ship,', 'see what breaks.'], pos: winPos(8, -0.05),
    label: 'a note to self', panel: { title: 'A note to self', text: "I don't wait to be qualified. I ship things, see what breaks, and figure it out from there." }, support: [],
  },
  {
    id: 'note-skills', kind: 'note', color: '#bfe3c0', title: 'toolbox', lines: ['Python · C++ · JS', 'Arduino · IoT · Linux', 'Flask · Vercel · UPI'], pos: winPos(9, 0.04),
    label: 'toolbox', panel: { title: 'Toolbox', text: 'Python, C++, Arduino, JavaScript, Flask, Linux (Pop!_OS), IoT, AI / planning systems, hardware, Razorpay / UPI, Vercel, product design, systems thinking.' }, support: [],
  },
]

// at the end of the string: the next role is an open slot
const next = [{
  id: 'note-next', kind: 'note', color: '#f4a261', title: "what's next?", lines: ['this spot is open.', 'hire me / collab →'], pos: [0.6, 0.2, 0.05],
  label: 'hire me — book a collaboration', panel: { title: 'Hire me', sub: 'freelance · collaborations', text: 'UI and landing pages, prototypes, hardware + software builds. Tell me what you are making.', cta: { label: 'book a 30-min call', href: CAL } },
  support: [hireNote],
}]

export const HEADERS = [
  { text: 'the work so far', pos: [-0.54, 0.4, 0.01] },
  { text: 'wins & receipts', pos: [-0.54, 0.07, -0.008] },
]

export const ITEMS = [...exp, ...next, ...wins, ...bits]
