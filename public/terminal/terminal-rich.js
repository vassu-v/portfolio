/**
 * terminal-rich.js
 *
 * The "portfolio" commands of the web terminal: about, projects, work, blog,
 * wins, contact, help… rendered as rich HTML panels from TERMINAL_DATA
 * (generated from src/data by scripts/generate-terminal-data.mjs). Anything
 * not handled here falls through to terminal-engine.js (the fake shell: ls,
 * cd, cat, nano, man, history, sudo…).
 *
 * Every command returns { html } (or null to fall through). Elements with
 * data-cmd="…" are clickable and run that command; links open normally.
 * No DOM access here — terminal-ui.js owns the page.
 */
(function (global) {
  "use strict";

  var D = global.TERMINAL_DATA || { projects: [], work: [], posts: [], wins: [] };

  function age() {
    var b = new Date(D.birth || "2009-09-02"), t = new Date();
    var a = t.getFullYear() - b.getFullYear();
    var m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cmd(c, label) { return '<button type="button" class="k-cmd" data-cmd="' + esc(c) + '">' + esc(label || c) + "</button>"; }
  function link(href, label) {
    var ext = /^https?:/.test(href);
    return '<a class="k-link" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(label || href.replace(/^https?:\/\/(www\.)?/, "").replace(/^mailto:/, "")) + "</a>";
  }
  function panel(title, body, opts) {
    opts = opts || {};
    return '<section class="k-panel' + (opts.accent ? " k-panel--accent" : "") + '">' +
      (title ? '<header class="k-panel__title">' + title + "</header>" : "") +
      '<div class="k-panel__body">' + body + "</div></section>";
  }
  function kv(rows) {
    return '<dl class="k-kv">' + rows.map(function (r) {
      return "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>";
    }).join("") + "</dl>";
  }
  function tags(list) { return '<span class="k-tags">' + (list || []).map(function (t) { return '<span class="k-tag">' + esc(t) + "</span>"; }).join("") + "</span>"; }
  function hint(html) { return '<p class="k-hint">' + html + "</p>"; }
  function paras(text) {
    return String(text || "").split(/\n+/).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  }
  function pick(list, arg, key) {
    if (!arg) return null;
    var n = parseInt(arg, 10);
    if (!isNaN(n) && n >= 1 && n <= list.length) return list[n - 1];
    var a = arg.toLowerCase();
    return list.filter(function (x) { return String(x[key]).toLowerCase().indexOf(a) === 0 || String(x.slug || "").indexOf(a) === 0; })[0] || null;
  }

  var CONTACT = [
    ["email", "mailto:shoryavardhaans2@gmail.com", "shoryavardhaans2@gmail.com"],
    ["call", "https://cal.com/shoryavardhaan/30min?overlayCalendar=true", "book a 30-min call"],
    ["linkedin", "https://www.linkedin.com/in/shoryavardhaan", "in/shoryavardhaan"],
    ["github", "https://github.com/vassu-v", "github.com/vassu-v"],
    ["x", "https://x.com/shoryavardhaan", "@shoryavardhaan"],
    ["instagram", "https://www.instagram.com/let_shorya.be/", "@let_shorya.be"],
    ["orcid", "https://orcid.org/0009-0009-1370-5230", "0009-0009-1370-5230"],
  ];

  // ------------------------------------------------------------------
  var C = {};

  C.welcome = function () {
    var facts = kv([
      ["name", '<span class="k-strong">Shoryavardhaan Gupta</span>'],
      ["age", esc(age()) + ", 11th grade (PCM)"],
      ["base", "Kolkata, India"],
      ["now", "Kolkata Fork Lead @ Bits&amp;Bytes · Youth Partner @ 4MQ.org"],
      ["builds", "civic tech · hardware · AI research"],
      ["shipped", esc(D.projects.length) + " projects · " + esc(D.posts.length) + " essays · " + esc(D.wins.length) + " wins"],
    ]);
    return {
      html:
        '<div class="k-welcome">' +
          '<pre class="k-ascii" aria-hidden="true" data-ascii-portrait></pre>' +
          '<span class="sr">ASCII portrait of Shoryavardhaan.</span>' +
          '<div class="k-welcome__main">' +
            '<h1 class="k-name">Shoryavardhaan</h1>' +
            '<p class="k-tagline">builds things that might matter, from a desk in Kolkata.</p>' +
            facts +
          "</div>" +
        "</div>" +
        hint("New here? Click a command or type one. " + cmd("projects") + " " + cmd("work") + " " + cmd("blog") + " " + cmd("wins") + " " + cmd("contact") + " " + cmd("help")),
    };
  };
  C.neofetch = C.welcome;
  C.fastfetch = C.welcome;

  // screenfetch: a hand-drawn ASCII mark (a peak with a dawn line — Kolkata
  // builder, arch-flavoured) beside system info, some of it the visitor's own.
  function logo() {
    var rows = 17, out = [];
    for (var y = 0; y < rows; y++) {
      var half = Math.round((y + 1) * 1.15), pad = 20 - half, line = "";
      for (var x = 0; x < half * 2; x++) {
        var edge = x === 0 || x === half * 2 - 1;
        var inner = y > 9 && Math.abs(x - half + 0.5) < (y - 9) * 0.9;
        var c = edge ? (x === 0 ? "/" : "\\") : inner ? " " : y < 3 ? "o" : y < 7 ? "+" : y < 12 ? "s" : "o";
        if (y === 6 && !edge) c = "-";
        line += c;
      }
      var cls = y === 6 ? "lg2" : "lg1";
      out.push(" ".repeat(Math.max(0, pad)) + '<span class="' + cls + '">' + esc(line) + "</span>");
    }
    return out;
  }
  C.screenfetch = function () {
    var d = D, born = new Date(d.birth || "2009-09-02"), now = new Date();
    var months = (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth();
    var scr = (global.screen ? global.screen.width + "x" + global.screen.height : "unknown");
    var cores = (global.navigator && global.navigator.hardwareConcurrency) || "?";
    var mem = global.navigator && global.navigator.deviceMemory;
    var info = [
      '<span class="sf-who">visitor<span class="sf-at">@</span>shorya</span>',
      ["OS", "ShoryaOS x86_64 (arch, btw)"],
      ["Kernel", age() + ".0-builder"],
      ["Uptime", Math.floor(months / 12) + "y " + (months % 12) + "m"],
      ["Packages", d.projects.length + " projects, " + d.posts.length + " essays, " + d.wins.length + " wins"],
      ["Shell", "curiosity 5.9"],
      ["Resolution", esc(scr) + " (yours)"],
      ["WM", "hyprland"],
      ["Theme", "shorya [blue/orange]"],
      ["Font", "JetBrains Mono 14"],
      ["CPU", esc(cores) + "-core (yours)"],
      ["RAM", mem ? esc(mem) + "G+ (yours)" : "enough"],
      ["Location", "Kolkata, IN"],
      ["Status", '<span class="sf-ok">open to collab</span>'],
    ].map(function (r) { return typeof r === "string" ? r : '<span class="sf-k">' + r[0] + ":</span> " + r[1]; });
    var art = logo();
    var n = Math.max(art.length, info.length), lines = [];
    for (var i = 0; i < n; i++) lines.push('<span class="sf-art">' + (art[i] || "") + "</span>" + (info[i] || ""));
    return {
      html: '<pre class="sf">' + lines.join("\n") + "</pre>" +
        hint("type " + cmd("help") + " or try " + cmd("about") + " " + cmd("projects") + " " + cmd("work") + " " + cmd("blog") + " " + cmd("contact")),
    };
  };

  // short greeting used when the fastfetch pane is already on screen
  C.motd = function () {
    var last = new Date(Date.now() - 1000 * 60 * 47);
    return {
      html: '<div class="k-motd"><p><span class="k-name">Welcome to ShoryaOS</span> <span class="k-dim">(arch, btw) · tty1</span></p>' +
        '<p class="k-dim">Last login: ' + esc(last.toDateString()) + " " + esc(last.toTimeString().slice(0, 5)) + " from your browser</p>" +
        "<p>I'm Shoryavardhaan, " + esc(age()) + ", building civic tech, hardware and AI from Kolkata. This terminal is the fast way through everything.</p></div>" +
        hint("start here: " + cmd("about") + " " + cmd("projects") + " " + cmd("work") + " " + cmd("blog") + " " + cmd("wins") + " " + cmd("contact") + " · or " + cmd("help")),
    };
  };

  C.help = function () {
    var group = function (title, rows) {
      return '<div class="k-help__group"><h3>' + title + "</h3><ul>" + rows.map(function (r) {
        return "<li>" + cmd(r[0].split(" ")[0], r[0]) + "<span>" + r[1] + "</span></li>";
      }).join("") + "</ul></div>";
    };
    return {
      html: panel("help", '<div class="k-help">' +
        group("explore", [["about", "who I am, in a paragraph"], ["projects", "things I've built — try <code>project 1</code>"], ["work", "roles &amp; where I've been"], ["blog", "essays — try <code>read 1</code>"], ["wins", "awards, receipts, firsts"], ["skills", "the toolbox"]]) +
        group("reach me", [["contact", "every way to say hi"], ["email", "opens your mail app"], ["call", "book a 30-min call"], ["sudo hire-me", "you know you want to"]]) +
        group("the shell", [["ls", "list files (it's a real-ish filesystem)"], ["cd work", "move around"], ["cat about.md", "read a file"], ["history", "what you've typed"], ["clear", "clean the screen"], ["theme", "change colours"]]) +
        group("elsewhere", [["gui", "back to the 3D room"], ["classic", "the plain web page"], ["exit", "leave"]]) +
        "</div>") + hint("<kbd>Tab</kbd> completes · <kbd>→</kbd> accepts the suggestion · <kbd>↑</kbd><kbd>↓</kbd> history · <kbd>Ctrl</kbd>+<kbd>L</kbd> clears"),
    };
  };

  C.about = function () {
    return {
      html: panel("about.md",
        '<p class="k-lead">I don\'t wait to be qualified. I ship things, see what breaks, and figure it out from there.</p>' +
        "<p>" + esc(age()) + ", in 11th grade navigating PCM, while leading <b>Bits&amp;Bytes Kolkata</b>, consulting at <b>4MQ.org</b>, and building open-source tools that solve real gaps, not demo projects.</p>" +
        "<p>Work spans hardware (" + cmd("project lifi", "LiFi mesh networks") + ", " + cmd("project chemx", "Arduino reaction simulators") + "), AI research (" + cmd("project planning", "planning failures on Zenodo") + "), and product: " + cmd("project buy4chai", "Buy4Chai") + " for India's Stripe exclusion problem, " + cmd("project sarkarsathi", "SarkarSathi") + " for civic accountability.</p>" +
        "<p>The thread: <b>constraint thinking</b>. Building the right thing with what's actually available.</p>"),
    };
  };
  C.whoami = function () {
    return { html: '<p>visitor — but this terminal belongs to <b>Shoryavardhaan Gupta</b>, ' + esc(age()) + ", builder, Kolkata. " + cmd("about", "more →") + "</p>" };
  };

  C.projects = function () {
    var rows = D.projects.map(function (p, i) {
      return '<li class="k-row">' +
        '<span class="k-row__n">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="k-row__main">' + cmd("project " + p.slug, p.name) + '<span class="k-row__sub">' + esc(p.tagline) + "</span></span>" +
        '<span class="k-row__meta">' + esc(p.period || "") + "</span></li>";
    }).join("");
    return { html: panel("projects", '<ol class="k-rows">' + rows + "</ol>") + hint("open one: " + cmd("project 1") + " or click a name") };
  };

  C.project = function (args) {
    var p = pick(D.projects, args[0], "name");
    if (!p) return { html: '<p class="k-err">project: which one? ' + cmd("projects", "see the list") + "</p>" };
    var how = (p.how || []).map(function (h) { return "<li><b>" + esc(h.label) + "</b> — " + esc(h.text) + "</li>"; }).join("");
    var impact = (p.impact || []).map(function (m) { return '<div class="k-stat"><b>' + esc(m.val) + "</b><span>" + esc(m.label) + "</span></div>"; }).join("");
    var links = [];
    if (p.github) links.push(link(p.github, "source"));
    if (p.live) links.push(link(p.live, "live"));
    links.push(link("/project/" + p.slug, "full case study"));
    return {
      html: panel(esc(p.name) + ' <span class="k-dim">· ' + esc(p.period || "") + "</span>",
        '<p class="k-lead">' + esc(p.tagline) + "</p>" + tags(p.tags) +
        "<h4>problem</h4>" + paras(p.problem) +
        "<h4>solution</h4>" + paras(p.solution) +
        (how ? "<h4>how it works</h4><ul class=\"k-list\">" + how + "</ul>" : "") +
        (impact ? '<h4>impact</h4><div class="k-stats">' + impact + "</div>" : "") +
        '<p class="k-links">' + links.join(" · ") + "</p>", { accent: true }),
    };
  };

  C.work = function (args) {
    if (args[0]) {
      var e = pick(D.work, args[0], "org");
      if (!e) return { html: '<p class="k-err">work: no role matching "' + esc(args[0]) + '". ' + cmd("work", "see all") + "</p>" };
      var extra = (e.extra || []).map(function (x) { return "<li>" + esc(x.title) + ' <span class="k-dim">· ' + esc(x.period) + " · " + esc(x.type) + "</span></li>"; }).join("");
      return {
        html: panel(esc(e.org) + (e.live ? ' <span class="k-live">● now</span>' : ""),
          kv([["role", esc(e.role)], ["type", esc(e.type)], ["dates", esc(e.period)]]) + paras(e.desc) +
          (extra ? '<h4>also here</h4><ul class="k-list">' + extra + "</ul>" : "") + tags(e.skills) +
          (e.cta ? '<p class="k-links">' + link(e.cta.href, e.cta.label) + "</p>" : "")),
      };
    }
    var rows = D.work.map(function (e, i) {
      return '<li class="k-row"><span class="k-row__n">' + (e.live ? '<span class="k-live">●</span>' : "○") + "</span>" +
        '<span class="k-row__main">' + cmd("work " + (i + 1), e.org) + '<span class="k-row__sub">' + esc(e.role) + "</span></span>" +
        '<span class="k-row__meta">' + esc(e.period) + "</span></li>";
    }).join("");
    return { html: panel("work", '<ol class="k-rows">' + rows + "</ol>") + hint("● = current · details: " + cmd("work 1")) };
  };
  C.experience = C.work;

  C.blog = function () {
    var rows = D.posts.map(function (p, i) {
      return '<li class="k-row"><span class="k-row__n">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="k-row__main">' + cmd("read " + (i + 1), p.title) + '<span class="k-row__sub">' + esc(p.category || "") + " · " + esc(p.readTime || "") + "</span></span>" +
        '<span class="k-row__meta">' + esc(p.date) + "</span></li>";
    }).join("");
    return { html: panel("the log", '<ol class="k-rows">' + rows + "</ol>") + hint("read one: " + cmd("read 1") + " · everything: " + link("/blog", "/blog")) };
  };
  C.log = C.blog;

  C.read = function (args) {
    var p = pick(D.posts, args[0], "title");
    if (!p) return { html: '<p class="k-err">read: which entry? ' + cmd("blog", "see the log") + "</p>" };
    return {
      html: panel(esc(p.title),
        '<p class="k-dim">' + esc(p.category || "") + " · " + esc(p.date) + " · " + esc(p.readTime || "") + "</p>" +
        '<p class="k-lead">' + esc(p.subtitle) + "</p>" + paras(p.lede) +
        (p.quote ? '<blockquote class="k-quote">' + esc(p.quote) + "</blockquote>" : "") +
        '<p class="k-links">' + link(p.external || "/blog/" + p.slug, "keep reading →") + "</p>", { accent: true }),
    };
  };

  C.wins = function () {
    var rows = D.wins.map(function (w) {
      return '<li class="k-win"><b>' + esc(w.title) + '</b> <span class="k-dim">' + esc(w.sub) + "</span><p>" + esc(w.text) + "</p>" +
        (w.project ? cmd("project " + w.project, "→ the project") : "") + "</li>";
    }).join("");
    return { html: panel("wins &amp; receipts", '<ul class="k-wins">' + rows + "</ul>") };
  };
  C.awards = C.wins;

  C.skills = function () {
    return {
      html: panel("toolbox", tags(["Python", "C++", "JavaScript", "Arduino", "IoT", "Flask", "Linux (Pop!_OS)", "Vercel", "Razorpay / UPI", "AI / planning systems", "Hardware", "Product design", "Systems thinking", "Constraint thinking"])),
    };
  };
  C.stack = C.skills;

  C.contact = function () {
    return {
      html: panel("contact", '<p class="k-lead">Want to build something together?</p>' +
        kv(CONTACT.map(function (c) { return [c[0], link(c[1], c[2])]; })), { accent: true }) +
        hint("shortcuts: " + cmd("email") + " " + cmd("call") + " · or from your own terminal: <code>curl shoryavardhaan.vercel.app</code>"),
    };
  };
  C.socials = C.contact;

  function opener(href, msg) {
    return function () { return { html: "<p>" + msg + " " + link(href) + "</p>", open: href }; };
  }
  C.email = opener("mailto:shoryavardhaans2@gmail.com", "opening your mail app →");
  C.call = opener("https://cal.com/shoryavardhaan/30min?overlayCalendar=true", "opening the calendar →");
  C.github = opener("https://github.com/vassu-v", "opening GitHub →");
  C.linkedin = opener("https://www.linkedin.com/in/shoryavardhaan", "opening LinkedIn →");

  C.sudo = function (args) {
    if ((args[0] || "").replace(/^-+/, "") === "hire-me" || args.join(" ") === "hire me") {
      return { html: '<p class="k-ok">[sudo] permission granted. good call.</p><p>opening the calendar → ' + link("https://cal.com/shoryavardhaan/30min?overlayCalendar=true", "cal.com/shoryavardhaan") + "</p>", open: "https://cal.com/shoryavardhaan/30min?overlayCalendar=true" };
    }
    return null; // the engine has the rest of the sudo bit
  };

  C.gui = function () { return { html: "<p>back to the 3D room…</p>", navigate: "/" }; };
  C["3d"] = C.gui;
  C.room = C.gui;
  C.classic = function () { return { html: "<p>opening the plain page…</p>", navigate: "/?classic" }; };

  C.date = function () { return { html: "<p>" + esc(new Date().toString()) + "</p>" }; };
  C.echo = function (args) { return { html: "<p>" + esc(args.join(" ")) + "</p>" }; };

  var THEMES = ["shorya", "catppuccin", "gruvbox", "nord", "paper"];
  C.theme = function (args) {
    var t = (args[0] || "").toLowerCase();
    if (THEMES.indexOf(t) === -1) {
      return { html: panel("theme", "<p>pick one:</p><p>" + THEMES.map(function (x) { return cmd("theme " + x, x); }).join(" ") + "</p>") };
    }
    return { html: '<p class="k-ok">theme → ' + esc(t) + "</p>", theme: t };
  };

  // names the UI offers for completion / ghost suggestions
  var NAMES = Object.keys(C).filter(function (k) { return k !== "neofetch"; });
  function argChoices(name) {
    if (name === "project") return D.projects.map(function (p) { return p.slug; });
    if (name === "read") return D.posts.map(function (p, i) { return String(i + 1); });
    if (name === "work") return D.work.map(function (e, i) { return String(i + 1); });
    if (name === "theme") return THEMES;
    if (name === "sudo") return ["hire-me"];
    return [];
  }

  global.TerminalRich = {
    run: function (name, args) { return Object.prototype.hasOwnProperty.call(C, name) ? C[name](args) : null; },
    names: NAMES,
    argChoices: argChoices,
    age: age,
    data: D,
  };
})(typeof self !== "undefined" ? self : this);
