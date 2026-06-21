// ─── Blog posts ────────────────────────────────────────────────────────────────
//
// Keep posts ordered newest-first — LAST_UPDATED derives from POSTS[0].date.
//
// Content block types:
//   { type: 'paragraph', text: '...' }
//   { type: 'heading',   text: '...' }
//   { type: 'pullquote', text: '...' }   ← rendered as large italic quote
//   { type: 'divider' }                  ← three dots separator
//
// personal: 'best' | 'learned' | null
// featured: true = appears in the portfolio homepage Log section (pick exactly 3)
// externalUrl + platform: set if the full piece lives on Medium/LinkedIn/etc.

export const POSTS = [
  {
    n: '01',
    slug: 'why-i-build',
    title: 'Nobody told me to start. That was the point.',
    subtitle: 'Two years of shipping real things from Kolkata, and what nobody tells you about starting before you\'re supposed to.',
    category: 'Reflection',
    date: 'Jun 2026',
    isoDate: '2026-06-21',
    readTime: '5 min read',
    hero: '/syi.webp',
    featured: true,
    personal: 'best',
    externalUrl: null,
    platform: null,
    content: [
      { type: 'paragraph', text: 'There\'s a version of this story where I say I always knew I\'d build things. That I was coding at eight. That growing up in Kolkata shaped me in some clean, narratable way. That version is tidy. It\'s also not what happened.' },
      { type: 'paragraph', text: 'What happened is I was 14, bored in a way school couldn\'t fix, and I started solving problems I was actually irritated by. Not with permission. Not with a plan. Just because the alternative — waiting until I had a degree, a job, a title — felt like a waste of time I didn\'t have back.' },
      { type: 'pullquote', text: 'The permission to build doesn\'t come from outside. You just start, and then you\'re a builder.' },
      { type: 'divider' },
      { type: 'paragraph', text: 'Kolkata is not Bangalore. There\'s no startup ecosystem I accidentally wandered into. No senior engineer who took me under their wing. No incubator that handed me resources. The infrastructure for a young person with an idea is mostly people telling you to focus on your boards.' },
      { type: 'paragraph', text: 'That turned out to be useful. When you don\'t have the ecosystem, you build differently. You build for real problems because you\'re surrounded by them. SarkarSathi came out of watching how civic complaints vanish into government systems that were never designed to respond. Buy4Chai came out of being an Indian developer who couldn\'t get paid by international supporters without a wall where Stripe should be. LiFi came out of thinking seriously about what happens to connectivity when the infrastructure fails.' },
      { type: 'pullquote', text: 'When you don\'t have the ecosystem, the only thing you have is the problem. Turns out that\'s enough.' },
      { type: 'divider' },
      { type: 'paragraph', text: 'The clearest thing two years of building has taught me isn\'t technical. It\'s that shipping something — actually deploying it, having real users, getting 33 comments from people who have the exact same problem — teaches you things no tutorial reaches. Tutorials teach you how to code. Real projects teach you what to build and why it matters. Those are different educations.' },
      { type: 'paragraph', text: 'I built SarkarSathi during board exams as the sole technical person on a 5-person remote team. It placed in the top 1,000 from 26,000+ India Innovates entries. I published AI planning research on Zenodo at 15. I open-sourced Buy4Chai and posted it back to the same Reddit thread where I\'d confirmed the problem was real. None of this happened because I had extra time. It happened because I chose to use the time I had differently than I was supposed to.' },
      { type: 'pullquote', text: 'Time spent building is never wasted even when the project fails. Time spent waiting for permission to start is just gone.' },
      { type: 'divider' },
      { type: 'paragraph', text: 'I\'m 16. I have no idea what the next five years look like except that I\'m going to keep shipping things and seeing what sticks. Some of it will fail — quietly or loudly. Some of it already has.' },
      { type: 'paragraph', text: 'But the thing about building in public is that the record is real. The GitHub commits exist. The Reddit thread has 9.4K views. The India Innovates result is what it is. You can\'t fake your way to those things. You just have to do the work, earlier than anyone told you to.' },
    ],
  },
  {
    n: '02',
    slug: 'building-buy4chai',
    title: 'Why Indian developers can\'t get paid online — and how I fixed it',
    subtitle: 'How a Reddit thread confirmed the problem was real — and everyone was just coping.',
    category: 'Building',
    date: 'May 2026',
    isoDate: '2026-05-01',
    readTime: '4 min read',
    hero: '/projects/log_buy4chai_reddit.jpeg',
    featured: true,
    personal: 'best',
    externalUrl: null,
    platform: null,
    content: [
      { type: 'paragraph', text: 'A few weeks before shipping, I posted on r/indiandevs asking if anyone else couldn\'t accept support for their open source work without Stripe. 29 upvotes. 33 comments. 9.4K views. Turns out everyone had the same problem and nobody was solving it. Just coping. Workarounds. A quiet acceptance that this is how it is.' },
      { type: 'pullquote', text: 'Buy Me a Coffee? Stripe. Ko-fi? Stripe. GitHub Sponsors? Stripe. PayPal works, but the fees and UX are embarrassing.' },
      { type: 'paragraph', text: 'In a lot of countries you simply don\'t get Stripe access — no clear criteria, no appeal process, just a wall. Dropping your UPI ID in a README feels janky. Unprofessional. International supporters have no clean way to send anything. That gap is real and nobody was building for it.' },
      { type: 'divider' },
      { type: 'paragraph', text: 'So I built Buy4Chai. A self-hosted supporter page with Razorpay and UPI out of the box. But it doesn\'t stop there — if you have any payment link, manual or otherwise, you can integrate it. The setup video and AI prompts walk you through adding your own gateway without touching much code. Fork it, edit one config file, deploy to Vercel in ten minutes. Zero platform fees. Money goes directly to you.', link: { word: 'Buy4Chai', href: '/project/buy4chai' } },
      { type: 'paragraph', text: 'I posted it back to the same community. The numbers look small on the internet — GitHub stars, forks, LinkedIn likes, reposts. But there\'s something else to those numbers.' },
      { type: 'pullquote', text: 'Picture those people physically in a room saying "this actually solves my problem." That\'s not small. That\'s real.' },
      { type: 'paragraph', text: 'It\'s not perfect. But the wheel is turning. Open source, MIT license. Contributions welcome, issues open, discussions open. Would love to build on this with you.' },
    ],
  },
  {
    n: '03',
    slug: 'markets-dont-get-disrupted',
    title: 'Markets don\'t get disrupted. They get aged out.',
    subtitle: 'Everyone\'s watching AI take jobs. That\'s not where the quiet danger is.',
    category: 'Perspective',
    date: 'May 2026',
    isoDate: '2026-05-15',
    readTime: '3 min read',
    hero: '/projects/log_aged_out.jpeg',
    featured: true,
    personal: null,
    externalUrl: null,
    platform: null,
    content: [
      { type: 'paragraph', text: 'Everyone\'s watching AI take jobs. That\'s the only headline anyone\'s writing. That\'s not where the quiet danger is.' },
      { type: 'paragraph', text: 'The current builder economy runs on a gap. People need things done that they can\'t do themselves. Website? Hire someone. App for the business? Hire someone. That gap is the entire business model of thousands of agencies and freelancers right now.' },
      { type: 'paragraph', text: 'But look at who\'s starting businesses in fifteen years. The person who grew up on Canva, Framer, Lovable, Wix. Who\'s been building things since they were fourteen. Who doesn\'t experience "I need a website" as a problem requiring outside help. They\'ll just do it. Not always well. But well enough. Same thing is happening with content — the business owner who couldn\'t write copy used to hire someone. The incoming generation grew up writing online.' },
      { type: 'pullquote', text: 'The gap doesn\'t get filled by a better tool. It disappears because the next generation of buyers never had it.' },
      { type: 'divider' },
      { type: 'paragraph', text: 'This doesn\'t mean freelance dies. The next generation will have more spending power and they\'ll spend differently. On convenience, speed, access. Not because they can\'t do something, but because they\'d rather not. That\'s a different door opening.' },
      { type: 'paragraph', text: 'What gets aged out is the middle. The serviceable, the affordable, the good enough. What survives is either the top — work so good that good enough isn\'t good enough — or the people who read where spending is actually migrating.' },
      { type: 'pullquote', text: 'Markets don\'t get disrupted. They get aged out. Nobody\'s writing that headline either.' },
    ],
  },
  {
    n: '04',
    slug: 'apple-ai-decade',
    title: 'Apple\'s been playing a different game since 2017',
    subtitle: 'While everyone rented Nvidia GPUs and called it infrastructure, Apple quietly built AI silicon before AI was the thing to build for.',
    category: 'Perspective',
    date: 'Apr 2026',
    isoDate: '2026-04-01',
    readTime: '3 min read',
    hero: '/projects/log_apple_ai.jpeg',
    featured: false,
    personal: null,
    externalUrl: 'https://medium.com/@shoryavardhaans2/the-ai-market-is-quietly-shifting-it-started-a-decade-ago-67201dd22fa5',
    platform: 'Medium',
    content: [
      { type: 'paragraph', text: 'Apple put the entire iPhone Air motherboard inside the camera bump — CPU, everything. The rest is screen and battery. Nobody noticed. Everyone was busy complaining about the charging cable.' },
      { type: 'paragraph', text: 'The AI race didn\'t start when everyone thinks it did. While the whole industry was renting Nvidia GPUs and calling it infrastructure, Apple was quietly building purpose-built AI silicon into every device they shipped. Since 2017. ChatGPT didn\'t exist. The AI boom was years away.' },
      { type: 'pullquote', text: 'Everyone else built hardware, then figured out how to make AI run on it. Apple built hardware specific to AI before AI was the thing to build for.' },
      { type: 'paragraph', text: 'The companies that win the next decade of AI aren\'t going to have the best model. They\'re going to own the full stack — chip, OS, software — all optimized together. Apple\'s been doing that quietly for almost a decade. Full breakdown on Medium.' },
    ],
  },
  {
    n: '05',
    slug: 'both-groups-are-losing',
    title: 'Both groups are losing. Just differently.',
    subtitle: 'One ships without understanding. The other learns syntax while the world moves on. Neither has figured out the actual question.',
    category: 'Reflection',
    date: 'Apr 2026',
    isoDate: '2026-04-15',
    readTime: '4 min read',
    hero: '/projects/log_ai_students.jpeg',
    featured: false,
    personal: 'learned',
    externalUrl: 'https://medium.com/p/703a2e7f624d',
    platform: 'Medium',
    content: [
      { type: 'paragraph', text: 'Coding changed more in the last year than the decade before it. And I\'m watching two types of students emerge around me.' },
      { type: 'paragraph', text: 'One group is shipping constantly — three projects a week, impressive GitHub streaks, always something new to show. Ask them how their project works under the hood and they go quiet. They didn\'t build it; they directed it. The other group is doing the opposite: ignoring every tool that could free up their thinking, learning syntax line by line, staying strictly within the syllabus. Technically clean. Practically behind.' },
      { type: 'pullquote', text: 'Both are losing. Just in different ways.' },
      { type: 'paragraph', text: 'The problem isn\'t AI. It\'s using it without knowing what you\'re actually trying to get good at. Figure out what you\'re building toward — then offload everything outside that to AI, and go deep on everything inside it.' },
      { type: 'paragraph', text: 'Shipping is good. Mindless shipping isn\'t. If you can\'t explain what your project does, why you made the decisions you made, and where it would break — you didn\'t build anything. You just watched AI build it for you.' },
    ],
  },
  {
    n: '06',
    slug: 'hardware-failure',
    title: 'Why "needs vs. wants" is the wrong framework',
    subtitle: 'Teaching traditional financial literacy to a generation running on algorithmic desire engines — and what we\'re actually missing.',
    category: 'Research',
    date: 'Feb 2026',
    isoDate: '2026-02-01',
    readTime: '5 min read',
    hero: '/projects/log_hardware_failure.png',
    featured: false,
    personal: null,
    externalUrl: 'https://www.linkedin.com/pulse/hardware-failure-why-needs-vs-wants-killing-teen-financial-kim-0gjhe/',
    platform: 'LinkedIn',
    content: [
      { type: 'paragraph', text: 'Traditional financial literacy teaches "needs vs. wants" to a generation facing algorithmic desire engines — then acts surprised when restrictive saving snaps into first-paycheck binges. The framework was built for a different era.' },
      { type: 'paragraph', text: 'The Hardware Failure framework explains what most miss: midnight spending isn\'t a character failure. The prefrontal cortex is offline. What\'s running is emotional relief-seeking. Real financial sovereignty requires understanding biology first, mechanism second, strategy third — not guilt, not budget apps.' },
      { type: 'pullquote', text: 'Actual agency requires understanding the hardware. Not fighting it.' },
      { type: 'paragraph', text: 'Contributed this with Dr. Richard Y. Kim. The full piece digs into the elastic tension mechanism, the Fuel Tank vs. Engine deployment model, and what financial education actually needs to look like for this generation.' },
    ],
  },
]

export function getPost(slug) {
  return POSTS.find(p => p.slug === slug) ?? null
}

// Automatically reflects the date of the newest post (POSTS[0])
export const LAST_UPDATED = POSTS[0]?.date ?? '—'
