/**
 * terminal-engine.js
 *
 * Pure JS port of terminal_sim.py's process_command(state, command) engine.
 * Framework-agnostic, no DOM access anywhere in this file — safe to drop
 * into any future React (or other) codebase's state management untouched.
 *
 * Content (bio, work history, projects, blog excerpts, contact scripts) is
 * copied verbatim from the Python source. See SPEC.md alongside the
 * original terminal_sim.py prototype for the full interface contract this
 * mirrors.
 *
 * Exposed as a UMD-ish global: `TerminalEngine` in a plain <script> tag,
 * or `module.exports` under CommonJS/bundlers.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = mod;
  } else {
    root.TerminalEngine = mod;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ==========================================================================
  // Virtual filesystem definition
  // ==========================================================================

  function file(content, executable) {
    return { type: "file", content: content, executable: !!executable };
  }

  function dir(children) {
    return { type: "dir", children: children };
  }

  // --- real file contents, verbatim from terminal_sim.py ---

  var ABOUT_MD =
    "# Shoryavardhaan Gupta\n\n" +
    "At 17, in 11th grade navigating PCM, while leading Bits&Bytes Kolkata, " +
    "serving as Youth Partner at 4MQ.org, and building open-source tools " +
    "that solve real gaps, not demo projects.\n\n" +
    "Work spans hardware (LiFi mesh networks, Arduino reaction simulators), " +
    "AI research (planning systems and grounding failures on Zenodo), and " +
    "product — Buy4Chai for India's Stripe exclusion problem, SarkarSathi for " +
    "civic accountability. The thread: constraint thinking. Building the " +
    "right thing with what's actually available.\n\n" +
    "Researching AI planning failures since 15. National ideathon recognition. " +
    "First international payment from Kolkata. None of it felt like an " +
    "achievement at the time. It felt like the next thing to figure out.\n\n" +
    "Based in Kolkata, India. Type `help` if you get stuck poking around.\n";

  var WORK_BITSANDBYTES =
    "# Bits&Bytes\n\n" +
    "Role: Kolkata Fork Lead (Community)\n" +
    "Dates: Apr 2026 – Present\n\n" +
    "Leading Bits&Bytes in Kolkata, a teen-led builder community running " +
    "hackathons and shipping real projects. Bringing the same energy to " +
    "Eastern India that the rest of the country already has.\n\n" +
    "Skills: Leadership, Community Building, Events\n";

  var WORK_4MQ =
    "# 4MQ.org\n\n" +
    "Role: Youth Partner (Full-time · Equity)\n" +
    "Dates: Apr 2026 – Present\n\n" +
    "First Youth Partner. Own the Antigravity Workflow, the knowledge system " +
    "powering how 4MQ synthesizes content. Co-authored episodes with Richard " +
    "on money and behavior. I suggest what we build, then build it.\n\n" +
    "Earlier at 4MQ: Guest Fellow (Jan – Apr 2026, Part-time). " +
    "Also currently: Consultant (May 2026 – Present, Part-time), " +
    "alongside the Youth Partner role above.\n\n" +
    "Skills: Content Strategy, Financial Literacy, Systems\n";

  var WORK_BEYOND_ROTE =
    "# Beyond Rote\n\n" +
    "Role: Research & Outreach Lead (Internship)\n" +
    "Dates: Jan – Apr 2026\n\n" +
    "Coordinated faculty engagement and research submissions for the Inquiry " +
    "Series. Fielded 50+ research questions from 120+ students alongside " +
    "researcher Chris Barry. Screened submissions, built researcher networks.\n\n" +
    "Skills: Research, Outreach, Community\n";

  var WORK_UTSAVY =
    "# Utsavy\n\n" +
    "Role: Experience Designer, UI/UX (Internship)\n" +
    "Dates: Jun – Jul 2025\n\n" +
    "Designed UX workflows and interface templates for an event management " +
    "platform. Custom designs increased inquiry submissions by 20%. Designed " +
    "AI prompts and onboarding flows. Trained incoming interns on the design " +
    "system.\n\n" +
    "Skills: UX Design, AI Prompting, Mentoring\n";

  var WORK_FREELANCE =
    "# Freelance\n\n" +
    "Role: UI & Landing Page Design\n" +
    "Dates: Mar 2026 – Present\n\n" +
    "Building landing pages and UI systems for lead conversion. Brand " +
    "positioning, conversion optimization, maintenance-based pricing.\n\n" +
    "Skills: UI Design, Conversion, Brand Positioning\n" +
    "Book a call: https://cal.com/shoryavardhaan/30min?overlayCalendar=true\n";

  var PROJ_BUY4CHAI =
    "# Buy4Chai\n\n" +
    "Self-hosted supporter page for developers Stripe locked out of. " +
    "Razorpay and UPI native, zero platform fees, deploys to Vercel in " +
    "10 minutes. Built after a Reddit thread surfaced 29 upvotes of people " +
    "who'd resigned themselves to janky workarounds.\n\n" +
    "Problem:  Stripe doesn't operate for most Indian developers. Buy Me a " +
    "Coffee and Ko-fi don't support UPI or Razorpay natively. A Reddit " +
    "thread surfaced it clearly: 29 upvotes from developers who'd simply " +
    "stopped trying to earn from their work.\n\n" +
    "Solution: A self-hosted supporter page you deploy to Vercel in under " +
    "10 minutes. Razorpay and UPI work natively — no platform cut, you own " +
    "the data, the experience, and the URL.\n\n" +
    "Stack: Open Source, Razorpay/UPI, Vercel, MIT, JavaScript\n" +
    "Stats: 16+ GitHub stars · 7 forks · MIT license\n" +
    "Repo: https://github.com/vassu-v/Buy4Chai\n";

  var PROJ_SARKARSATHI =
    "# SarkarSathi\n\n" +
    "AI co-pilot for municipal accountability in India. Helps citizens " +
    "structure and escalate complaints to local government. Led as sole " +
    "technical member of a 5-person remote team during board exams.\n\n" +
    "Problem:  Civic complaints in India vanish into systems that were never " +
    "designed to respond. The problem isn't awareness — it's structured " +
    "escalation.\n\n" +
    "Solution: Started as a complaint co-pilot that frames issues clearly " +
    "and routes them to the right authority. For India Innovates 2026, it " +
    "evolved into full governance intelligence: commitment tracking, " +
    "complaint clustering, and an agentic advisor for elected representatives.\n\n" +
    "Stack: AI, Civic Tech, Python, FastAPI, Gemini AI, Vector DB\n" +
    "Stats: India Innovates 2026 · Top 1,000 / 26,000+ entries · National media coverage\n" +
    "Repo: https://github.com/vassu-v/india-innovates-CivicNTech\n";

  var PROJ_LIFI =
    "# Disaster-Resilient LiFi Network\n\n" +
    "Off-grid IR mesh that turns street lamps into emergency nodes. Mesh " +
    "network retrofitted onto solar street lamps using IR transceivers. " +
    "Hop-based routing delivers emergency messages when power grids and " +
    "mobile networks fail simultaneously.\n\n" +
    "Problem:  During disasters, power grids and mobile networks fail at the " +
    "same time. The street lamps are already there, mostly solar-powered — " +
    "the question was whether they could become a communication mesh.\n\n" +
    "Solution: Retrofits solar street lamps with ESP8266 microcontrollers and " +
    "IR transceivers. Each lamp becomes a mesh node; messages hop between " +
    "nodes using gradient-based routing, fully off-grid.\n\n" +
    "Stack: IoT, Hardware, C, Arduino, ESP8266, LiFi, Mesh Networks\n" +
    "Stats: CBSE Regional Science Exhibition 2025–26 · 6 GitHub stars · Stable multi-hop in live testing\n" +
    "Repo: https://github.com/vassu-v/D-LiFi-Proto\n";

  var PROJ_CHEMX =
    "# ChemX\n\n" +
    "Physical chemistry reaction simulator controlled from a browser: " +
    "Arduino, LEDs, electromagnet. First hardware project — taught " +
    "constraint thinking before I had words for it.\n\n" +
    "Problem:  Chemistry education is almost entirely symbolic — equations " +
    "on a board, reactions over after one lab session. No way to interact " +
    "with the process or ask \"what happens if I change this.\"\n\n" +
    "Solution: LEDs represent atomic bonds forming and breaking, an " +
    "electromagnet simulates molecular attraction/repulsion, and a web " +
    "interface lets you select a reaction and watch real hardware respond.\n\n" +
    "Stack: Arduino, Electronics, C/C++, Web Interface, IoT\n" +
    "Stats: Dec 2024 – Feb 2025 · School science exhibition\n" +
    "Repo: https://github.com/vassu-v/ChemX_001\n";

  var PROJ_PLANNING_RESEARCH =
    "# Grounded Planning Research\n\n" +
    "Exposing brittle AI reasoning that high success rates hide. Shows " +
    "structured, repeatable failure modes — the kind that only surface " +
    "under real pressure.\n\n" +
    "Problem:  AI planning benchmarks are saturating — agents report 90%+ " +
    "success, but success rates measure outcomes, not the reasoning that " +
    "produced them.\n\n" +
    "Solution: Object commitment as a pressure point — forcing an agent to " +
    "explicitly name which objects it's operating on before selecting " +
    "actions exposes brittle reasoning that high success rates hide.\n\n" +
    "Stack: AI Research, Planning Systems, Python, Ablation Study, Zenodo\n" +
    "Stats: Published on Zenodo · Jan 9, 2026 · 3 GitHub stars · written at 15\n" +
    "Repo: https://github.com/vassu-v/action-vs-object-planning\n" +
    "Read: https://zenodo.org/records/19513284\n";

  var BLOG_WHY_I_BUILD =
    "# Nobody told me to start. That was the point.\n\n" +
    "Three years of shipping real things from Kolkata, and what nobody " +
    "tells you about starting before you're supposed to.\n\n" +
    "What happened is I was 14, bored in a way school couldn't fix, and I " +
    "started solving problems I was actually irritated by. Not with " +
    "permission. Not with a plan.\n\n" +
    "Kolkata is not Bangalore. There's no startup ecosystem I accidentally " +
    "wandered into. When you don't have the ecosystem, you build " +
    "differently — you build for real problems because you're surrounded by " +
    "them.\n\n" +
    "I'm 17. I have no idea what the next five years look like except that " +
    "I'm going to keep shipping things and seeing what sticks.\n\n" +
    "Read the rest: https://shoryavardhaan.vercel.app/blog/why-i-build\n";

  var BLOG_BUILDING_BUY4CHAI =
    "# Why Indian developers can't get paid online, and how I fixed it\n\n" +
    "How a Reddit thread confirmed the problem was real. Everyone was just " +
    "coping.\n\n" +
    "A few weeks before shipping, I posted on r/indiandevs asking if anyone " +
    "else couldn't accept support for their open source work without " +
    "Stripe. 29 upvotes. 33 comments. 9.4K views.\n\n" +
    "So I built Buy4Chai — a self-hosted supporter page with Razorpay and " +
    "UPI out of the box, zero platform fees, deploy to Vercel in ten minutes.\n\n" +
    "Read the rest: https://shoryavardhaan.vercel.app/blog/building-buy4chai\n";

  var BLOG_MARKETS =
    "# Markets don't get disrupted. They get aged out.\n\n" +
    "Everyone's watching AI take jobs. That's not where the quiet danger is.\n\n" +
    "The current builder economy runs on a gap: people need things done " +
    "they can't do themselves. But look at who's starting businesses in " +
    "fifteen years — people who've been building things since they were " +
    "fourteen.\n\n" +
    "What gets aged out is the middle. What survives is either the top, or " +
    "the people who read where spending is actually migrating.\n\n" +
    "Read the rest: https://shoryavardhaan.vercel.app/blog/markets-dont-get-disrupted\n";

  var BLOG_APPLE_AI =
    "# Apple's been playing a different game since 2017\n\n" +
    "While everyone rented Nvidia GPUs and called it infrastructure, Apple " +
    "quietly built AI silicon before AI was the thing to build for.\n\n" +
    "The AI race didn't start when everyone thinks it did. Apple was " +
    "quietly building purpose-built AI silicon into every device they " +
    "shipped since 2017 — years before ChatGPT existed.\n\n" +
    "The companies that win the next decade of AI won't have the best " +
    "model. They'll own the full stack.\n\n" +
    "Full breakdown on Medium — read the rest: https://shoryavardhaan.vercel.app/blog/apple-ai-decade\n";

  var BLOG_BOTH_GROUPS =
    "# Both groups are losing. Just differently.\n\n" +
    "One ships without understanding. The other learns syntax while the " +
    "world moves on. Neither has figured out the actual question.\n\n" +
    "One group is shipping constantly, but ask them how their project works " +
    "under the hood and they go quiet. The other group ignores every tool " +
    "that could free their thinking — technically clean, practically behind.\n\n" +
    "The problem isn't AI. It's using it without knowing what you're " +
    "actually trying to get good at.\n\n" +
    "Read the rest: https://shoryavardhaan.vercel.app/blog/both-groups-are-losing\n";

  var BLOG_HARDWARE_FAILURE =
    "# Why \"needs vs. wants\" is the wrong framework\n\n" +
    "Teaching traditional financial literacy to a generation running on " +
    "algorithmic desire engines, and what we're actually missing.\n\n" +
    "Traditional financial literacy teaches \"needs vs. wants\" to a " +
    "generation facing algorithmic desire engines, then acts surprised when " +
    "restrictive saving snaps into first-paycheck binges.\n\n" +
    "Midnight spending isn't a character failure — the prefrontal cortex is " +
    "offline. Real financial sovereignty requires understanding biology " +
    "first, mechanism second, strategy third.\n\n" +
    "Contributed with Dr. Richard Y. Kim — read the rest: " +
    "https://shoryavardhaan.vercel.app/blog/hardware-failure\n";

  // --- .sh file *source* content ---

  var CONTACT_SH_SRC =
    "#!/bin/sh\n" +
    "# contact.sh — say hi\n" +
    "echo \"Reach out any time: shoryavardhaans2@gmail.com\"\n" +
    "echo \"I read everything — say hi.\"\n";

  var CALL_SH_SRC =
    "#!/bin/sh\n" +
    "# call.sh — grab time on the calendar\n" +
    "echo \"Grab a slot on my calendar: https://cal.com/shoryavardhaan/30min?overlayCalendar=true\"\n";

  var EMAIL_SH_SRC =
    "#!/bin/sh\n" +
    "# email.sh — just the address\n" +
    "echo \"shoryavardhaans2@gmail.com\"\n" +
    "echo \"Drop me a line — I'll get back to you.\"\n";

  var TERMINAL_SH_SRC =
    "#!/bin/sh\n" +
    "# terminal.sh — you know exactly what this is\n" +
    "echo \"You just ran a shell script inside a shell script that pretends to\"\n" +
    "echo \"be a filesystem that doesn't exist. It's turtles all the way down.\"\n";

  function buildFilesystem() {
    return dir({
      "about.md": file(ABOUT_MD),
      work: dir({
        "bitsandbytes.md": file(WORK_BITSANDBYTES),
        "4mq.md": file(WORK_4MQ),
        "beyond-rote.md": file(WORK_BEYOND_ROTE),
        "utsavy.md": file(WORK_UTSAVY),
        "freelance.md": file(WORK_FREELANCE),
      }),
      projects: dir({
        buy4chai: dir({ "README.md": file(PROJ_BUY4CHAI) }),
        sarkarsathi: dir({ "README.md": file(PROJ_SARKARSATHI) }),
        "lifi-network": dir({ "README.md": file(PROJ_LIFI) }),
        chemx: dir({ "README.md": file(PROJ_CHEMX) }),
        "planning-research": dir({ "README.md": file(PROJ_PLANNING_RESEARCH) }),
      }),
      blog: dir({
        "why-i-build.md": file(BLOG_WHY_I_BUILD),
        "building-buy4chai.md": file(BLOG_BUILDING_BUY4CHAI),
        "markets-dont-get-disrupted.md": file(BLOG_MARKETS),
        "apple-ai-decade.md": file(BLOG_APPLE_AI),
        "both-groups-are-losing.md": file(BLOG_BOTH_GROUPS),
        "hardware-failure.md": file(BLOG_HARDWARE_FAILURE),
      }),
      "contact.sh": file(CONTACT_SH_SRC, true),
      "call.sh": file(CALL_SH_SRC, true),
      "email.sh": file(EMAIL_SH_SRC, true),
      "terminal.sh": file(TERMINAL_SH_SRC, true),
    });
  }

  var FILESYSTEM = buildFilesystem();

  var SCRIPT_OUTPUTS = {
    "contact.sh":
      "Reach out any time: shoryavardhaans2@gmail.com\n" +
      "I read everything — say hi.\n",
    "call.sh":
      "Grab a slot on my calendar: https://cal.com/shoryavardhaan/30min?overlayCalendar=true\n",
    "email.sh":
      "shoryavardhaans2@gmail.com\n" +
      "Drop me a line — I'll get back to you.\n",
    "terminal.sh":
      "You just ran a shell script inside a shell script that pretends to\n" +
      "be a filesystem that doesn't exist. It's turtles all the way down.\n" +
      "(this is an easter egg — there's nothing else here)\n",
  };

  var REFUSED_COMMANDS = { mkdir: 1, rmdir: 1, rm: 1, touch: 1, mv: 1, cp: 1 };

  var WHOAMI_BIO =
    "Shoryavardhaan Gupta — 17, Kolkata, India. 11th grade, South Point\n" +
    "High School. Student developer building AI applications, civic tech,\n" +
    "and hardware projects.\n" +
    "\n" +
    "Currently   Kolkata Fork Lead @ Bits&Bytes\n" +
    "            Youth Partner @ 4MQ.org\n" +
    "Also        Consultant @ 4MQ.org\n" +
    "            Freelance UI / landing-page design\n" +
    "Research    Grounded/embodied AI planning — published on Zenodo,\n" +
    "            written at 15. ORCID: 0009-0009-1370-5230\n" +
    "Recognition India Innovates 2026 — Top 1,000 of 26,000+ entries\n" +
    "            CBSE Regional Science Exhibition 2025-26\n" +
    "\n" +
    "GitHub      https://github.com/vassu-v\n" +
    "LinkedIn    https://www.linkedin.com/in/shoryavardhaan\n" +
    "More info   https://shoryavardhaan.vercel.app/blog/why-i-build\n" +
    "Portfolio   https://shoryavardhaan.vercel.app";

  var THEMES = {
    default: "#ffffff",
    amber: "#ffb000",
    green: "#33ff33",
    blue: "#7aa2f7",
  };

  var FONTS = {
    default: "JetBrains Mono, monospace",
    mono: "Space Mono, monospace",
    ibm: "IBM Plex Mono, monospace",
    vt: "VT323, monospace",
  };

  var MAN_PAGES = {
    ls: "NAME\n    ls — list directory contents\nSYNOPSIS\n    ls [-la] [path]\nDESCRIPTION\n    Lists files and directories. -l/-a-style flags switch to the long form.",
    cd: "NAME\n    cd — change the working directory\nSYNOPSIS\n    cd [path]\nDESCRIPTION\n    Changes the current directory. No argument, ~, or / goes to root; .. goes up.",
    cat: "NAME\n    cat — print file contents\nSYNOPSIS\n    cat <file>\nDESCRIPTION\n    Prints a file's raw contents, markdown and shell scripts included, exactly as stored — no rendering.",
    pwd: "NAME\n    pwd — print working directory\nSYNOPSIS\n    pwd\nDESCRIPTION\n    Prints the current directory as an absolute path.",
    whoami: "NAME\n    whoami — print the current identity\nSYNOPSIS\n    whoami\nDESCRIPTION\n    This terminal answers as its owner, not the visitor typing.",
    sudo: "NAME\n    sudo — execute a command as another user\nSYNOPSIS\n    sudo <command>\nDESCRIPTION\n    Prompts for a password. You will not get one right.",
    nano: "NAME\n    nano — simple session-only text editor\nSYNOPSIS\n    nano <file>\nDESCRIPTION\n    Opens a file for editing this session only. Type :wq to save and exit, :q to discard and exit.",
    theme: "NAME\n    theme — set the terminal color hint\nSYNOPSIS\n    theme <amber|green|blue|default>\nDESCRIPTION\n    Records a color preference for the rendering client. No effect on this plain-text engine.",
    font: "NAME\n    font — set the terminal font hint\nSYNOPSIS\n    font <default|mono|ibm|vt>\nDESCRIPTION\n    Records a font preference for the rendering client. No effect on this plain-text engine.",
    neofetch: "NAME\n    neofetch — print a system-info-style panel\nSYNOPSIS\n    neofetch\nDESCRIPTION\n    Prints an info panel about the site owner, styled like the real neofetch tool.",
    man: "NAME\n    man — print the manual page for a command\nSYNOPSIS\n    man <command>\nDESCRIPTION\n    Prints a short deadpan manual entry for a built-in command.",
    history: "NAME\n    history — print command history\nSYNOPSIS\n    history\nDESCRIPTION\n    Prints every command run so far this session, numbered from 1.",
    banner: "NAME\n    banner — print a block-letter ASCII banner\nSYNOPSIS\n    banner\nDESCRIPTION\n    Prints the site owner's name in large block letters. Alias: figlet.",
    figlet: "NAME\n    figlet — print a block-letter ASCII banner\nSYNOPSIS\n    figlet\nDESCRIPTION\n    Alias for banner. Prints the site owner's name in large block letters.",
    clear: "NAME\n    clear — clear the screen\nSYNOPSIS\n    clear\nDESCRIPTION\n    Signals the client to wipe the rendered terminal buffer.",
    help: "NAME\n    help — list available commands\nSYNOPSIS\n    help\nDESCRIPTION\n    Prints the command reference.",
    exit: "NAME\n    exit — leave the terminal\nSYNOPSIS\n    exit\nDESCRIPTION\n    Ends the session.",
    mkdir: "NAME\n    mkdir — make a directory\nSYNOPSIS\n    mkdir <name>\nDESCRIPTION\n    Refused. This filesystem is read-only fiction.",
    rmdir: "NAME\n    rmdir — remove a directory\nSYNOPSIS\n    rmdir <name>\nDESCRIPTION\n    Refused. This filesystem is read-only fiction.",
    rm: "NAME\n    rm — remove a file\nSYNOPSIS\n    rm <name>\nDESCRIPTION\n    Refused. This filesystem is read-only fiction.",
    touch: "NAME\n    touch — create an empty file\nSYNOPSIS\n    touch <name>\nDESCRIPTION\n    Refused. This filesystem is read-only fiction.",
    mv: "NAME\n    mv — move or rename a file\nSYNOPSIS\n    mv <src> <dst>\nDESCRIPTION\n    Refused. This filesystem is read-only fiction.",
    cp: "NAME\n    cp — copy a file\nSYNOPSIS\n    cp <src> <dst>\nDESCRIPTION\n    Refused. This filesystem is read-only fiction.",
  };

  var HELP_TEXT =
    "Available commands:\n" +
    "  ls [path]        list directory contents (add -la for the long form)\n" +
    "  cd [path]        change directory (cd, cd ~, cd / -> root; cd .. -> up)\n" +
    "  cat <file>       print a file's contents\n" +
    "  nano <file>      edit a file for this session only (:wq save+exit, :q discard+exit)\n" +
    "  pwd              print the current directory path\n" +
    "  whoami           print who this terminal belongs to\n" +
    "  theme <name>     set a color hint (amber, green, blue, default)\n" +
    "  font <name>      set a font hint (default, mono, ibm, vt)\n" +
    "  neofetch         system-info-style panel\n" +
    "  man <command>    print a fake manual page for a command\n" +
    "  history          list commands run so far this session\n" +
    "  banner / figlet  print a big ASCII-art name banner\n" +
    "  ./<script>       run a script in the current directory (contact.sh, call.sh, email.sh, terminal.sh)\n" +
    "  bash <script>    same as above\n" +
    "  sh <script>      same as above\n" +
    "  <script>         same as above, no ./ or extension needed (e.g. `call`)\n" +
    "  sudo <cmd>       try to run something as root (you won't get far)\n" +
    "  clear            clear the screen\n" +
    "  help             show this help text\n" +
    "  exit             leave the terminal";

  // ==========================================================================
  // Filesystem helpers
  // ==========================================================================

  function resolvePath(cwd, arg) {
    if (!arg) return cwd.slice();
    if (arg === "~" || arg === "/") return [];

    var segments, start;
    if (arg.charAt(0) === "/") {
      segments = arg.replace(/^\/+|\/+$/g, "").split("/");
      start = [];
    } else {
      segments = arg.split("/");
      start = cwd.slice();
    }

    var path = start;
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (seg === "" || seg === ".") continue;
      else if (seg === "..") {
        if (path.length) path = path.slice(0, -1);
      } else {
        path = path.concat([seg]);
      }
    }
    return path;
  }

  function getNode(path) {
    var node = FILESYSTEM;
    for (var i = 0; i < path.length; i++) {
      var seg = path[i];
      if (node.type !== "dir" || !Object.prototype.hasOwnProperty.call(node.children, seg)) {
        return null;
      }
      node = node.children[seg];
    }
    return node;
  }

  function pathKey(path) {
    return path.join("/");
  }

  function pathStr(path) {
    return path.length ? "/" + path.join("/") : "/";
  }

  function prompt(cwd) {
    return "shoryavardhaan:" + pathStr(cwd) + "$ ";
  }

  function fileContent(state, path, node) {
    var overrides = state.fs_overrides || {};
    var key = pathKey(path);
    if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key];
    return node.content;
  }

  function findScript(cwdNode, scriptName) {
    if (!cwdNode || cwdNode.type !== "dir") return null;
    var node = cwdNode.children[scriptName];
    if (!node || node.type !== "file" || !node.executable) return null;
    return node;
  }

  // ==========================================================================
  // neofetch / banner helpers
  // ==========================================================================

  var BANNER_FONT = {
    S: ["#####", "#    ", "#####", "    #", "#####"],
    H: ["#   #", "#   #", "#####", "#   #", "#   #"],
    O: ["#####", "#   #", "#   #", "#   #", "#####"],
    R: ["#####", "#   #", "#####", "#  # ", "#   #"],
    Y: ["#   #", " # # ", "  #  ", "  #  ", "  #  "],
    A: ["#####", "#   #", "#####", "#   #", "#   #"],
    V: ["#   #", "#   #", "#   #", " # # ", "  #  "],
    D: ["#### ", "#   #", "#   #", "#   #", "#### "],
    N: ["#   #", "##  #", "# # #", "#  ##", "#   #"],
    " ": ["     ", "     ", "     ", "     ", "     "],
  };

  var BANNER_WORD = "SHORYAVARDHAAN";

  function renderBanner() {
    var rows = ["", "", "", "", ""];
    for (var i = 0; i < BANNER_WORD.length; i++) {
      var ch = BANNER_WORD.charAt(i).toUpperCase();
      var glyph = BANNER_FONT[ch] || BANNER_FONT[" "];
      for (var r = 0; r < 5; r++) {
        rows[r] += glyph[r] + " ";
      }
    }
    return rows.map(function (row) { return row.replace(/\s+$/, ""); }).join("\n");
  }

  function renderNeofetch(state) {
    var theme = state.theme || "default";
    var font = state.font || "default";
    var lines = [
      "shorya@ShoryaOS",
      "----------------",
      "OS: ShoryaOS (portfolio-terminal build)",
      "Host: shoryavardhaan.vercel.app",
      "Name: Shoryavardhaan Gupta",
      "Role: Student developer — CS, AI applications, software",
      "Location: Kolkata, India",
      "Uptime: building since 2023 (~3 years)",
      "Now: Kolkata Fork Lead @ Bits&Bytes · Youth Partner @ 4MQ.org",
      "Stack: Python, C, JavaScript/Node.js",
      "Theme: " + theme,
      "Font: " + font,
      "Shell: process_command() v2",
    ];
    return lines.join("\n");
  }

  // ==========================================================================
  // The pure engine
  // ==========================================================================

  function initialState() {
    return {
      cwd: [],
      awaiting_password: false,
      theme: "default",
      font: "default",
      command_history: [],
      in_editor: null,
      fs_overrides: {},
    };
  }

  function carryForward(state) {
    return {
      cwd: (state.cwd || []).slice(),
      awaiting_password: false,
      theme: state.theme || "default",
      font: state.font || "default",
      command_history: (state.command_history || []).slice(),
      in_editor: state.in_editor || null,
      fs_overrides: Object.assign({}, state.fs_overrides || {}),
    };
  }

  var NANO_HELP = "^G Help   ^O Write Out   ^X Exit";

  function nanoEnterOutput(displayName, content) {
    var header = "  GNU nano 7.2                    " + displayName;
    var parts = [header];
    if (content) parts.push(content.replace(/\n+$/, ""));
    parts.push(NANO_HELP);
    parts.push(
      "[session-only editor: type a line with just :wq to save+exit, " +
      ":q to discard+exit — real nano's Ctrl+X doesn't survive a plain text protocol]"
    );
    return parts.join("\n");
  }

  /**
   * THE pure engine function. No I/O of any kind happens in here.
   * @param {object} state - current session state (see initialState()).
   * @param {string} command - one raw line of input.
   * @returns {[object, string]} [newState, outputText]
   */
  function processCommand(state, command) {
    var newState = carryForward(state);
    var raw = command;

    // --- sudo "password" capture ---
    if (state.awaiting_password) {
      return [newState, "no no not shorya! nice try 🔒"];
    }

    // --- nano editing mode: short-circuits everything else ---
    if (state.in_editor) {
      var editor = state.in_editor;
      var line = raw.replace(/\n+$/, "");
      var strippedLine = line.trim();

      if (strippedLine === ":wq") {
        var key = pathKey(editor.path);
        var overrides = Object.assign({}, newState.fs_overrides);
        overrides[key] = editor.buffer;
        newState.fs_overrides = overrides;
        newState.in_editor = null;
        return [newState, "nano: wrote " + editor.display];
      }

      if (strippedLine === ":q") {
        newState.in_editor = null;
        return [newState, "nano: discarded changes to " + editor.display];
      }

      var newBuffer = editor.buffer;
      if (newBuffer && !/\n$/.test(newBuffer)) newBuffer += "\n";
      newBuffer += line + "\n";
      newState.in_editor = Object.assign({}, editor, { buffer: newBuffer });
      return [newState, ""];
    }

    var stripped = raw.trim();
    if (stripped === "") {
      return [newState, ""];
    }

    var parts = stripped.split(/\s+/);
    var cmd = parts[0];
    var args = parts.slice(1);

    // record history (top-level commands only)
    newState.command_history = newState.command_history.concat([stripped]);

    // --- --help / -h ---
    if ((args.indexOf("--help") !== -1 || args.indexOf("-h") !== -1) && Object.prototype.hasOwnProperty.call(MAN_PAGES, cmd)) {
      return [newState, MAN_PAGES[cmd]];
    }

    // --- exit ---
    if (cmd === "exit") {
      newState.should_exit = true;
      return [newState, "goodbye — thanks for poking around 👋"];
    }

    // --- clear ---
    if (cmd === "clear") {
      newState.clear = true;
      return [newState, ""];
    }

    // --- help ---
    if (cmd === "help") {
      return [newState, HELP_TEXT];
    }

    // --- whoami ---
    if (cmd === "whoami") {
      return [newState, WHOAMI_BIO];
    }

    // --- pwd ---
    if (cmd === "pwd") {
      return [newState, pathStr(state.cwd)];
    }

    // --- sudo ---
    if (cmd === "sudo") {
      newState.awaiting_password = true;
      return [newState, "[sudo] password for visitor: "];
    }

    // --- refused fs-mutation commands ---
    if (Object.prototype.hasOwnProperty.call(REFUSED_COMMANDS, cmd)) {
      return [newState, "no no, not root 🙅"];
    }

    // --- theme ---
    if (cmd === "theme") {
      if (!args.length) {
        var availableThemes = Object.keys(THEMES).sort().join(", ");
        return [newState, "usage: theme <name>  (available: " + availableThemes + ")"];
      }
      var themeName = args[0].toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(THEMES, themeName)) {
        var availT = Object.keys(THEMES).sort().join(", ");
        return [newState, "theme: unknown theme '" + args[0] + "' — available: " + availT];
      }
      newState.theme = themeName;
      return [newState, "theme set to " + themeName + " — text-color hint: " + THEMES[themeName]];
    }

    // --- font ---
    if (cmd === "font") {
      if (!args.length) {
        var availableFonts = Object.keys(FONTS).sort().join(", ");
        return [newState, "usage: font <name>  (available: " + availableFonts + ")"];
      }
      var fontName = args[0].toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(FONTS, fontName)) {
        var availF = Object.keys(FONTS).sort().join(", ");
        return [newState, "font: unknown font '" + args[0] + "' — available: " + availF];
      }
      newState.font = fontName;
      return [newState, "font set to " + fontName + " — font-family hint: " + FONTS[fontName]];
    }

    // --- neofetch ---
    if (cmd === "neofetch") {
      return [newState, renderNeofetch(newState)];
    }

    // --- man ---
    if (cmd === "man") {
      if (!args.length) return [newState, "What manual page do you want?"];
      var targetCmd = args[0];
      var page = MAN_PAGES[targetCmd];
      if (page === undefined) return [newState, "No manual entry for " + targetCmd];
      return [newState, page];
    }

    // --- history ---
    if (cmd === "history") {
      var lines = newState.command_history.map(function (c, i) {
        return "  " + (i + 1) + "  " + c;
      });
      return [newState, lines.join("\n")];
    }

    // --- banner / figlet ---
    if (cmd === "banner" || cmd === "figlet") {
      return [newState, renderBanner()];
    }

    // --- ls ---
    if (cmd === "ls") {
      var pathArg = null;
      for (var a = 0; a < args.length; a++) {
        if (args[a].charAt(0) !== "-") { pathArg = args[a]; break; }
      }
      var longForm = args.some(function (x) { return x.charAt(0) === "-" && x.indexOf("l") !== -1; });
      var target = resolvePath(state.cwd, pathArg);
      var node = getNode(target);
      if (node === null) {
        return [newState, "ls: cannot access '" + pathArg + "': No such file or directory"];
      }
      if (node.type !== "dir") {
        return [newState, pathArg || ""];
      }
      var names = Object.keys(node.children).sort();
      var entries = [];
      for (var n = 0; n < names.length; n++) {
        var name = names[n];
        var child = node.children[name];
        if (child.type === "dir") entries.push(name + "/");
        else if (child.executable) entries.push(name + "*");
        else entries.push(name);
      }
      if (!entries.length) return [newState, ""];
      if (longForm) {
        var llines = names.map(function (name) {
          var child = node.children[name];
          if (child.type === "dir") return "drwxr-xr-x  " + name + "/";
          if (child.executable) return "-rwxr-xr-x  " + name + "*";
          return "-rw-r--r--  " + name;
        });
        return [newState, llines.join("\n")];
      }
      return [newState, entries.join("  ")];
    }

    // --- cd ---
    if (cmd === "cd") {
      var cdArg = args.length ? args[0] : null;
      var cdTarget = resolvePath(state.cwd, cdArg);
      if (cdArg === null || cdArg === "" || cdArg === "~" || cdArg === "/") {
        newState.cwd = cdTarget;
        return [newState, ""];
      }
      var cdNode = getNode(cdTarget);
      if (cdNode === null) return [newState, "no such directory: " + cdArg];
      if (cdNode.type !== "dir") return [newState, "not a directory: " + cdArg];
      newState.cwd = cdTarget;
      return [newState, ""];
    }

    // --- cat ---
    if (cmd === "cat") {
      if (!args.length) return [newState, "cat: missing operand"];
      var catArg = args[0];
      var catTarget = resolvePath(state.cwd, catArg);
      var catNode = getNode(catTarget);
      if (catNode === null) return [newState, "cat: " + catArg + ": No such file or directory"];
      if (catNode.type === "dir") return [newState, "cat: " + catArg + ": Is a directory"];
      var content = fileContent(newState, catTarget, catNode);
      return [newState, content.replace(/\n+$/, "")];
    }

    // --- nano ---
    if (cmd === "nano") {
      if (!args.length) return [newState, "usage: nano <file>"];
      var nanoArg = args[0];
      var nanoTarget = resolvePath(state.cwd, nanoArg);
      var nanoNode = getNode(nanoTarget);
      if (nanoNode === null) {
        return [newState, "nano: cannot create new files in this demo terminal — '" + nanoArg + "' doesn't exist yet"];
      }
      if (nanoNode.type === "dir") return [newState, "nano: " + nanoArg + ": Is a directory"];
      var nanoContent = fileContent(newState, nanoTarget, nanoNode);
      newState.in_editor = { path: nanoTarget, display: nanoArg, buffer: nanoContent };
      return [newState, nanoEnterOutput(nanoArg, nanoContent)];
    }

    // --- ./script, bash script, sh script ---
    var scriptName = null;
    if (cmd.indexOf("./") === 0) {
      scriptName = cmd.slice(2);
    } else if ((cmd === "bash" || cmd === "sh") && args.length) {
      scriptName = args[0];
    }

    if (scriptName !== null) {
      var cwdNode = getNode(state.cwd);
      var scriptNode = findScript(cwdNode, scriptName);
      if (scriptNode === null) {
        return [newState, "bash: " + scriptName + ": No such file or directory"];
      }
      return [newState, (SCRIPT_OUTPUTS[scriptName] || "").replace(/\n+$/, "")];
    }

    // --- bare script name fallback ---
    var bareCwdNode = getNode(state.cwd);
    var bareNode = findScript(bareCwdNode, cmd + ".sh");
    if (bareNode !== null) {
      return [newState, (SCRIPT_OUTPUTS[cmd + ".sh"] || "").replace(/\n+$/, "")];
    }

    // --- unrecognized ---
    return [newState, "command not found: " + cmd];
  }

  return {
    initialState: initialState,
    processCommand: processCommand,
    prompt: prompt,
    pathStr: pathStr,
    THEMES: THEMES,
    FONTS: FONTS,
  };
});
