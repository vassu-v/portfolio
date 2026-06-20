export const PROJECTS = [
  {
    n: '01',
    slug: 'buy4chai',
    featured: true,
    name: 'Buy4Chai',
    tagline: 'Self-hosted supporter page for devs Stripe locked out of.',
    tags: ['Open Source', 'Razorpay / UPI', 'Vercel', 'MIT', 'JavaScript'],
    desc: 'Self-hosted supporter page for developers Stripe locked out of. Razorpay and UPI native, zero platform fees, deploys to Vercel in 10 minutes. Built after a Reddit thread surfaced 29 upvotes of people who\'d resigned themselves to janky workarounds.',
    stat: '13 GitHub stars · 7 forks · MIT license',
    github: 'https://github.com/vassu-v/Buy4Chai',
    live: null,
    period: 'Early 2026',

    // ── detail page content ──
    problem: `Stripe doesn't operate for most Indian developers. Buy Me a Coffee and Ko-fi don't support UPI or Razorpay natively. The workarounds people used — QR code screenshots, manual bank transfers, awkward PayPal setups — broke the supporter experience entirely.

A Reddit thread surfaced it clearly: 29 upvotes from developers who'd simply stopped trying to earn from their work. Not because the audience wasn't there, but because the infrastructure didn't exist.`,

    solution: `Buy4Chai is a self-hosted supporter page you deploy to Vercel in under 10 minutes. Razorpay and UPI work natively, so supporters in India can pay without friction. No platform cut. You own the data, the experience, and the URL.

The name is deliberately local — a cup of chai is what you actually get in Kolkata when someone wants to say thank you.`,

    how: [
      { label: 'Setup', text: 'Fork the repo, drop in your Razorpay key and UPI ID, push to Vercel. Ten minutes including reading the README.' },
      { label: 'Payments', text: 'Razorpay handles card + UPI + netbanking. Supporters pick what they want to send and check out without leaving your page.' },
      { label: 'Zero fees', text: 'No platform cut. Razorpay charges their standard processing fee (1.9%), and that\'s it. No one else takes a slice.' },
      { label: 'MIT licensed', text: 'Fork it, modify it, white-label it. Seven people already have.' },
    ],

    images: [
      '/projects/buy4chai_live.png',
      '/projects/buy4chai_readme.png',
      '/projects/buy4chai_community.png',
    ],

    impact: [
      { val: '13', label: 'GitHub stars' },
      { val: '7', label: 'Forks' },
      { val: '❤️', label: 'Loved by the community' },
      { val: '1', label: 'Open issue being actively tracked' },
    ],
  },

  {
    n: '02',
    slug: 'sarkarsathi',
    featured: false,
    name: 'SarkarSathi',
    tagline: 'AI co-pilot for municipal accountability in India.',
    tags: ['AI', 'Civic Tech', 'Python', 'FastAPI', 'Gemini AI', 'Vector DB'],
    desc: 'AI co-pilot for municipal accountability — helps citizens structure and escalate complaints to local government. Led as sole technical member of a 5-person remote team during board exams.',
    stat: 'India Innovates 2026 · Top 1,000 / 26,000+ entries · National media coverage',
    github: 'https://github.com/vassu-v/india-innovates-CivicNTech',
    live: null,
    period: 'Jan – Mar 2026',

    problem: `Civic complaints in India vanish into systems that were never designed to respond. Citizens know what's broken in their ward — potholes, water supply failures, illegal construction — but translating lived experience into something a government portal will actually process is a skill most people don't have, and shouldn't need.

The problem isn't awareness. It's structured escalation.`,

    solution: `SarkarSathi started as a complaint co-pilot: the AI helps citizens frame their issue clearly, identifies the right authority, and routes the complaint with the language and documentation that actually gets responses.

For India Innovates 2026, it evolved into full governance intelligence for elected representatives — commitment tracking across campaign promises, complaint clustering by district and severity, and an agentic advisor that surfaces what needs attention before it becomes a crisis.

Built this as the sole technical member on a 5-person remote team. During board exams.`,

    how: [
      { label: 'Complaint intake', text: 'Conversational intake via chat. OCR for photo evidence. Structured output that matches government portal formats.' },
      { label: 'Semantic clustering', text: 'FastAPI + vector database groups similar complaints across districts. A hundred separate "no water" complaints surface as one data point.' },
      { label: 'Governance intelligence', text: 'Representatives see a real-time dashboard: commitments made vs. kept, complaint surge detection, agentic recommendations on where to direct resources.' },
      { label: 'Agentic advisor', text: 'Gemini AI reads the complaint corpus and generates specific, actionable briefings — not summaries, but decisions that can be acted on immediately.' },
    ],

    images: [
      '/projects/sarkarsathi_cm.jpg',
    ],

    impact: [
      { val: 'Top 1k', label: 'From 26,000+ India Innovates entries' },
      { val: '6', label: 'GitHub stars' },
      { val: '3', label: 'Forks' },
      { val: '5', label: 'Person team, sole technical lead' },
    ],
  },

  {
    n: '03',
    slug: 'lifi-network',
    featured: false,
    name: 'Disaster-Resilient LiFi Network',
    tagline: 'Off-grid IR mesh that turns street lamps into emergency nodes.',
    tags: ['IoT', 'Hardware', 'C', 'Arduino', 'ESP8266', 'LiFi', 'Mesh Networks'],
    desc: 'Mesh network retrofitted onto solar street lamps using IR transceivers. Hop-based routing delivers emergency messages when power grids and mobile networks fail simultaneously.',
    stat: 'CBSE Regional Science Exhibition 2025–26 · 6 GitHub stars · Stable multi-hop in live testing',
    github: 'https://github.com/vassu-v/D-LiFi-Proto',
    live: null,
    period: 'Dec 2025 – Jan 2026',

    problem: `During disasters — floods, earthquakes, cyclones — power grids and mobile networks fail at the same time. Emergency coordination becomes impossible precisely when it's needed most. Battery-powered radios require infrastructure, and internet-dependent systems are the first to go.

The street lamps are already there. Most of them run on solar. The question was whether you could turn them into a communication mesh without modifying the existing infrastructure permanently.`,

    solution: `D-LiFi-Proto retrofits solar street lamps with ESP8266 microcontrollers and IR transceivers. Each lamp becomes a mesh node. Messages hop between nodes using gradient-based routing — finding the optimal path through the network in real time, without any central server.

The system operates entirely off-grid. No power grid dependency. No mobile network. Just the solar panels that are already charging the lamps, and line-of-sight IR between nodes.`,

    how: [
      { label: 'Hardware', text: 'ESP8266 microcontrollers with IR transceivers clipped to existing lamp fixtures. No permanent modification required.' },
      { label: 'Routing', text: 'Gradient-based routing calculates the best path through the mesh dynamically. Nodes that fail simply get routed around.' },
      { label: 'Power', text: 'Each node draws from the lamp\'s existing solar battery. Works even if the grid is down and the lamp\'s LED circuit isn\'t.' },
      { label: 'Protocol', text: 'Custom hop-based messaging in C. Messages include priority levels so emergency alerts preempt normal traffic.' },
    ],

    images: [
      '/projects/lifi_exhibit.jpeg',
      '/projects/lifi_slide.jpeg',
      '/projects/lifi_report.png',
    ],

    impact: [
      { val: '6', label: 'GitHub stars' },
      { val: '4', label: 'Forks' },
      { val: '✓', label: 'Stable multi-hop in live testing' },
      { val: '2025', label: 'CBSE Regional Science Exhibition' },
    ],
  },

  {
    n: '04',
    slug: 'chemx',
    featured: false,
    name: 'ChemX',
    tagline: 'Physical chemistry simulator controlled from a browser.',
    tags: ['Arduino', 'Electronics', 'C/C++', 'Web Interface', 'IoT'],
    desc: 'Physical chemistry reaction simulator — Arduino, LEDs, electromagnet, controlled via browser. First hardware project. Taught constraint thinking before I had words for it.',
    stat: 'Dec 2024 – Feb 2025 · School science exhibition',
    github: 'https://github.com/vassu-v/ChemX_001',
    live: null,
    period: 'Dec 2024 – Feb 2025',

    problem: `Chemistry education in school is almost entirely symbolic — equations on a board, molecular diagrams in a textbook. The reactions happen in a flask during a lab session, and then they're over. There's no way to interact with the process, slow it down, reverse it, or ask "what happens if I change this variable."

I wanted to build something you could actually touch and control.`,

    solution: `ChemX is a physical simulator where chemical reactions happen in hardware. LEDs represent atomic bonds forming and breaking. An electromagnet simulates molecular attraction and repulsion. A web interface lets you select a reaction, adjust variables, and watch it play out on the physical rig in real time — not a simulation on a screen, but actual hardware responding.

It was my first hardware project. I didn't have a framework for thinking about constraint-based building at the time, but this is where I learned it: components don't work the way documentation says they do, and the interesting problems are always at the boundary between the physical and the digital.`,

    how: [
      { label: 'Hardware rig', text: 'Arduino Uno driving a custom PCB with LED arrays and an electromagnet module. Each reaction is encoded as a timed sequence of hardware events.' },
      { label: 'Web interface', text: 'Browser-based control panel served from the Arduino. Select reaction type, trigger it, watch the rig respond in real time.' },
      { label: 'Reactions', text: 'Acid-base neutralisation, oxidation-reduction, and precipitation reactions — each with distinct LED patterns and electromagnet states.' },
      { label: 'Constraint design', text: 'The Arduino\'s 2KB of RAM meant every byte mattered. Taught me to optimise before I knew what optimisation was.' },
    ],

    impact: [
      { val: '1st', label: 'Hardware project ever built' },
      { val: '✓', label: 'School science exhibition' },
      { val: '2mo', label: 'Built in two months alongside school' },
      { val: '→', label: 'Led directly to the LiFi network project' },
    ],
  },

  {
    n: '05',
    slug: 'planning-research',
    featured: false,
    name: 'Grounded Planning Research',
    tagline: 'Exposing brittle AI reasoning that high success rates hide.',
    tags: ['AI Research', 'Planning Systems', 'Python', 'Ablation Study', 'Zenodo'],
    desc: 'How forcing agents to explicitly commit to objects during planning exposes brittle reasoning that high success rates hide. Shows structured, repeatable failure modes — the kind that only surface under real pressure.',
    stat: 'Published on Zenodo · Jan 9, 2026 · 3 GitHub stars',
    github: 'https://github.com/vassu-v/action-vs-object-planning',
    live: 'https://zenodo.org',
    liveLabel: 'Read on Zenodo',
    period: 'Late 2025 – Jan 2026',

    problem: `AI planning benchmarks are saturating. Agents report 90%+ success rates on standard tasks. The assumption is that high success rates mean robust planning — but success rates measure outcomes, not the reasoning that produced them.

An agent can get to the right answer through fundamentally brittle logic, and you won't know until it fails on a slightly different problem. The question I wanted to answer: is there a pressure point that makes the brittleness visible before it fails in deployment?`,

    solution: `Object commitment is that pressure point. When you force an agent to explicitly name which objects it's operating on before selecting actions — rather than letting it discover them opportunistically — you expose something important: agents that were planning correctly stay correct, and agents that were guessing in the right direction fall apart.

The study runs a controlled ablation in a deterministic filesystem environment. Action-only variant vs. object-centric variant. Same tasks, same success criteria. The failure modes in the object-centric variant are structured and repeatable — you can predict where they'll occur, which means you can actually debug the reasoning.`,

    how: [
      { label: 'Environment', text: 'Deterministic filesystem tasks — file operations, directory traversal, conditional logic. Clean ground truth, no ambiguity in success/failure.' },
      { label: 'Ablation design', text: 'Action-only: agent selects an action and a target is inferred. Object-centric: agent must commit to the specific object before selecting the action.' },
      { label: 'Failure analysis', text: 'Object-centric variant surfaces consistent failure patterns tied to specific object relationships. These patterns don\'t appear in aggregate success metrics.' },
      { label: 'Implication', text: 'High-level success rates are insufficient diagnostics. Object commitment as a forced step is a practical technique for surfacing latent planning failures before deployment.' },
    ],

    impact: [
      { val: '3', label: 'GitHub stars' },
      { val: 'Jan 9', label: 'Published on Zenodo, 2026' },
      { val: 'Age 15', label: 'Written and published at 15' },
      { val: 'MIT', label: 'Open licensed' },
    ],
  },
]

export function getProject(slug) {
  return PROJECTS.find(p => p.slug === slug) ?? null
}
