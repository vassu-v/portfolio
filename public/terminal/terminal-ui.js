/**
 * terminal-ui.js — the only file here that touches the DOM.
 *
 * Commands resolve in two layers: TerminalRich (portfolio commands rendered
 * as panels from generated site data) first, then TerminalEngine (the fake
 * shell: filesystem, nano, man, history, sudo…). Adds what makes a terminal
 * usable by non-terminal people: clickable commands everywhere, fish-style
 * ghost suggestions, Tab completion, history, quick-command chips, themes.
 */
(function (global) {
  "use strict";

  var engine = global.TerminalEngine;
  var rich = global.TerminalRich;

  var CHIPS = ["about", "projects", "work", "blog", "wins", "contact", "help"];
  var SHELL_CMDS = ["ls", "cd", "cat", "pwd", "nano", "man", "history", "clear", "banner", "exit", "sudo"];
  var THEME_KEY = "cli-theme";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Engine output is plain text: give it light structure (headings, keys, links).
  function formatPlain(text) {
    return '<div class="plain">' + String(text).split("\n").map(function (line) {
      var e = esc(line).replace(/(https?:\/\/[^\s<]+)/g, '<a class="k-link" href="$1" target="_blank" rel="noopener">$1</a>');
      if (/^#\s/.test(line)) return '<span class="h">' + e.replace(/^#\s/, "") + "</span>";
      var m = e.match(/^([A-Za-z][\w ]{0,14}):(\s+)(.*)$/);
      if (m) return '<span class="key">' + m[1] + ":</span>" + m[2] + m[3];
      return e;
    }).join("\n") + "</div>";
  }

  function distance(a, b) {
    var d = [], i, j
    for (i = 0; i <= a.length; i++) d[i] = [i]
    for (j = 0; j <= b.length; j++) d[0][j] = j
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    return d[a.length][b.length]
  }

  // chafa-style true-colour ASCII: each cell keeps its pixel's hue (sky blue,
  // turban orange, skin), with a light saturation lift so it reads on dark.
  function portraitInto(pre, cols, rows) {
    cols = cols || 46; rows = rows || 30;
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas");
      c.width = cols; c.height = rows;
      var ctx = c.getContext("2d");
      var s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, Math.max(0, (img.height - s) * 0.1), s, s, 0, 0, cols, rows);
      var px = ctx.getImageData(0, 0, cols, rows).data;
      var ramp = " .,:;i1tfLCG08@";
      var out = "";
      for (var y = 0; y < rows; y++) {
        var run = "", col = "";
        for (var x = 0; x < cols; x++) {
          var i = (y * cols + x) * 4;
          var r = px[i], g = px[i + 1], b = px[i + 2];
          var l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          var ch = ramp[Math.min(ramp.length - 1, Math.floor(Math.pow(l, 0.8) * ramp.length))];
          var m = (r + g + b) / 3;
          var q = function (v) { return Math.max(0, Math.min(255, Math.round((m + (v - m) * 1.25) / 24) * 24)); };
          var k = "rgb(" + q(r) + "," + q(g) + "," + q(b) + ")";
          if (k !== col) { if (run) out += '<span style="color:' + col + '">' + esc(run) + "</span>"; run = ""; col = k; }
          run += ch;
        }
        out += '<span style="color:' + col + '">' + esc(run) + "</span>\n";
      }
      pre.innerHTML = out;
    };
    img.src = "/preview (1).jpg";
  }

  function kolTime() {
    try { return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }); }
    catch (e) { return "--:--"; }
  }

  function renderFetch(el) {
    var d = rich.data, a = rich.age();
    var born = new Date(d.birth || "2009-09-02"), now = new Date();
    var months = (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth();
    var rows = [
      ["OS", 'ShoryaOS x86_64 <span class="rule">(arch, btw)</span>'],
      ["Host", "a desk in Kolkata, IN"],
      ["Kernel", a + ".0-builder"],
      ["Uptime", Math.floor(months / 12) + " years, " + (months % 12) + " months"],
      ["Packages", d.projects.length + " projects, " + d.posts.length + " essays, " + d.wins.length + " wins"],
      ["Shell", "curiosity 5.9"],
      ["WM", "hyprland (constraint-thinking)"],
      ["Now", "Bits&amp;Bytes · 4MQ.org · freelance"],
      ["Stack", "Python · C++ · JS · Arduino · IoT"],
      ["School", "11th grade, PCM"],
    ];
    el.innerHTML =
      '<pre class="fetch__art" aria-hidden="true"></pre>' +
      '<div class="fetch__info"><div class="who">shorya<i>@</i>kolkata</div><div class="rule">────────────────</div>' +
      rows.map(function (r) { return '<div><span class="k">' + r[0] + "</span>: " + r[1] + "</div>"; }).join("") +
      '<div class="swatches" aria-hidden="true">' + ["--faint", "--err", "--ok", "--warn", "--accent", "--accent-2", "--dim", "--text"].map(function (v) { return '<i style="background:var(' + v + ')"></i>'; }).join("") + "</div></div>";
    portraitInto(el.querySelector(".fetch__art"), 40, 26);
  }

  // htop: what's actually running in Shorya's life, as processes.
  function renderTop(el) {
    var d = rich.data;
    var procs = d.work.map(function (w, i) {
      return { pid: 1000 + i * 37, user: "shorya", st: w.live ? "R" : "S", cmd: w.org.toLowerCase().replace(/[^a-z0-9.&]+/g, "-") + " --" + w.role.toLowerCase().split(/[ ,&]+/)[0], run: "work " + (i + 1), cpu: w.live ? 18 + i * 3 : 0 };
    }).concat(d.projects.slice(0, 3).map(function (p, i) {
      return { pid: 2100 + i * 41, user: "shorya", st: "S", cmd: p.slug + " --maintain", run: "project " + p.slug, cpu: 2 + i };
    })).concat([{ pid: 4242, user: "root", st: "R", cmd: "school --grade 11 --pcm", run: "about", cpu: 31 }]);
    var meters = [["build", 0.74], ["ship", 0.62], ["learn", 0.88], ["sleep", 0.21]];
    function bar(v) {
      var n = 22, f = Math.round(v * n), cls = v > 0.85 ? "m3" : v > 0.65 ? "m2" : "";
      return '[<b class="' + cls + '">' + "|".repeat(f) + "</b>" + " ".repeat(n - f) + "]";
    }
    function paint() {
      var jit = function (v) { return Math.max(0.05, Math.min(0.99, v + (Math.random() - 0.5) * 0.08)); };
      el.innerHTML =
        meters.map(function (m) { var v = jit(m[1]); return '<div class="meter"><span class="meter__lbl">' + m[0] + '</span><span class="meter__bar">' + bar(v) + '</span><span class="meter__val">' + Math.round(v * 100) + "%</span></div>"; }).join("") +
        '<p class="top__sum">Tasks: <b>' + procs.length + "</b>, " + procs.filter(function (p) { return p.st === "R"; }).length + " running · Load: 0.97 1.21 1.40 · Coffee: chai</p>" +
        '<table class="proc"><thead><tr><th>PID</th><th>USER</th><th>S</th><th>CPU%</th><th>Command</th></tr></thead><tbody>' +
        procs.map(function (p) {
          var cpu = p.cpu ? (p.cpu + Math.random() * 4).toFixed(1) : "0.0";
          return '<tr data-cmd="' + esc(p.run) + '" tabindex="0"><td>' + p.pid + "</td><td>" + p.user + '</td><td class="st-' + p.st + '">' + p.st + "</td><td>" + cpu + "</td><td>" + esc(p.cmd) + "</td></tr>";
        }).join("") + "</tbody></table>";
    }
    paint();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(function () { if (!document.hidden) paint(); }, 2200);
  }

  var WORKSPACES = [["1", "home", "welcome"], ["2", "projects", "projects"], ["3", "work", "work"], ["4", "blog", "blog"], ["5", "contact", "contact"]];

  function mount() {
    var win = document.getElementById("window");
    var log = document.getElementById("log");
    var input = document.getElementById("cmd");
    var form = document.getElementById("promptbar");
    var ghostTyped = win.querySelector(".ghost__typed");
    var ghostRest = win.querySelector(".ghost__rest");
    var promptPath = win.querySelector(".p-path");
    var titlePath = document.getElementById("title-path");
    var barTitle = document.getElementById("bar-title");
    var chips = document.getElementById("chips");
    var wsEl = document.getElementById("workspaces");
    var embedded = global.top !== global.self;
    if (embedded) document.documentElement.classList.add("embedded");

    var state = engine.initialState();
    var history = [];
    var cursor = null;
    var suggestion = "";

    // ---------- theme ----------
    function setTheme(t) {
      if (["catppuccin", "gruvbox", "nord", "paper"].indexOf(t) === -1) t = "shorya";
      if (t === "shorya") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* storage blocked */ }
    }
    try { setTheme(localStorage.getItem(THEME_KEY)); } catch (e) { /* storage blocked */ }

    // ---------- output ----------
    function entry(echo, html) {
      var div = document.createElement("div");
      div.className = "entry";
      var path = promptPath.textContent;
      div.innerHTML = (echo !== null ? '<div class="echo"><span class="ps">[<i>visitor</i>@<i>shorya</i> <u>' + esc(path) + "</u>]$</span><b>" + esc(echo) + "</b></div>" : "") + (html || "");
      log.appendChild(div);
      var pre = div.querySelector("[data-ascii-portrait]");
      if (pre) portraitInto(pre);
      requestAnimationFrame(function () {
        // keep the start of a tall answer in view rather than its end
        var top = div.offsetTop - 12;
        log.scrollTop = div.offsetHeight > log.clientHeight ? top : log.scrollHeight;
      });
    }

    function syncPrompt() {
      var p = engine.pathStr(state.cwd);
      var shown = p === "/" ? "~" : "~" + p;
      promptPath.textContent = state.in_editor ? "nano " + state.in_editor.display : shown;
      titlePath.textContent = shown;
      barTitle.textContent = "kitty — " + shown + (history.length ? " — " + history[history.length - 1] : "");
    }

    function leave(to) {
      if (embedded) { global.parent.postMessage({ type: "cli:exit" }, global.location.origin); return; }
      setTimeout(function () { global.location.href = to; }, 450);
    }

    // ---------- run ----------
    function run(raw) {
      var line = raw.replace(/\s+$/, "");
      cursor = null;
      if (state.in_editor || state.awaiting_password) {
        var r0 = engine.processCommand(state, raw);
        state = r0[0];
        entry(state.awaiting_password ? "" : line, r0[1] ? formatPlain(r0[1]) : "");
        syncPrompt();
        return;
      }
      if (!line.trim()) return;
      history.push(line);
      win.classList.remove("errored");
      var parts = line.trim().split(/\s+/);
      markWorkspace(parts[0].toLowerCase());
      var name = parts[0].toLowerCase(), args = parts.slice(1);

      var out = rich.run(name, args);
      if (out) {
        state.command_history = (state.command_history || []).concat([line]);
        entry(line, out.html);
        if (out.theme) setTheme(out.theme);
        if (out.open) global.open(out.open, /^mailto:/.test(out.open) ? "_self" : "_blank", "noopener");
        if (out.navigate) leave(out.navigate);
        return;
      }

      var r = engine.processCommand(state, raw);
      state = r[0];
      if (state.clear) { log.innerHTML = ""; state.clear = false; syncPrompt(); return; }
      var text = r[1];
      if (/command not found/i.test(text || "")) {
        text = null;
        var near = rich.names.concat(SHELL_CMDS).filter(function (c) { return distance(c, name) <= 2; })[0];
        win.classList.add("errored");
        entry(line, '<p class="k-err">' + esc(name) + ": not a command here." +
          (near ? ' did you mean <button type="button" class="k-cmd" data-cmd="' + near + '">' + near + "</button>?" : "") +
          '</p><p class="k-hint">try ' +
          '<button type="button" class="k-cmd" data-cmd="help">help</button> or one of ' +
          CHIPS.slice(0, 4).map(function (c) { return '<button type="button" class="k-cmd" data-cmd="' + c + '">' + c + "</button>"; }).join(" ") + "</p>");
      } else {
        entry(line, text ? formatPlain(text) : "");
      }
      syncPrompt();
      if (state.should_exit) leave("/");
    }

    // ---------- suggestions ----------
    function filesHere() {
      try {
        var r = engine.processCommand(Object.assign({}, state, { command_history: [] }), "ls");
        return (r[1] || "").split(/\s+/).filter(Boolean).map(function (f) { return f.replace(/[/*]$/, ""); });
      } catch (e) { return []; }
    }
    function suggest(value) {
      if (!value || /\s$/.test(value) && value.trim().split(/\s+/).length > 1) return "";
      var parts = value.split(/\s+/);
      if (parts.length === 1) {
        var pool = rich.names.concat(SHELL_CMDS);
        var hit = pool.filter(function (c) { return c.indexOf(parts[0].toLowerCase()) === 0 && c !== parts[0]; })[0];
        return hit ? hit.slice(parts[0].length) : "";
      }
      var name = parts[0].toLowerCase(), arg = parts[parts.length - 1];
      var choices = rich.argChoices(name);
      if (name === "cd" || name === "cat" || name === "nano") choices = filesHere();
      var pick = choices.filter(function (c) { return c.indexOf(arg) === 0 && c !== arg; })[0];
      return pick ? pick.slice(arg.length) : "";
    }
    function paintGhost() {
      suggestion = input.selectionStart === input.value.length ? suggest(input.value) : "";
      ghostTyped.textContent = input.value;
      ghostRest.textContent = suggestion;
    }

    // ---------- events ----------
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = "";
      paintGhost();
      run(v);
    });
    input.addEventListener("input", paintGhost);
    input.addEventListener("keydown", function (e) {
      if ((e.key === "Tab" || (e.key === "ArrowRight" && input.selectionStart === input.value.length)) && suggestion) {
        e.preventDefault();
        input.value += suggestion;
        paintGhost();
      } else if (e.key === "Tab") {
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        if (!history.length) return;
        e.preventDefault();
        cursor = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
        input.value = history[cursor]; paintGhost();
      } else if (e.key === "ArrowDown") {
        if (cursor === null) return;
        e.preventDefault();
        cursor = cursor + 1 >= history.length ? null : cursor + 1;
        input.value = cursor === null ? "" : history[cursor]; paintGhost();
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault(); log.innerHTML = "";
      } else if (e.key === "Escape") {
        input.value = ""; paintGhost();
      }
    });
    input.addEventListener("keyup", paintGhost);

    // Chips type their command into the prompt before running it, so people
    // learn the syntax by watching. Capped at ~300ms; any key skips it.
    var typing = null;
    function typeThenRun(c) {
      if (typing || matchMedia("(prefers-reduced-motion: reduce)").matches) { run(c); return; }
      var i = 0, step = Math.max(12, Math.min(40, 300 / c.length));
      input.value = "";
      typing = setInterval(function () {
        input.value = c.slice(0, ++i); paintGhost();
        if (i >= c.length) { clearInterval(typing); typing = null; input.value = ""; paintGhost(); run(c); }
      }, step);
    }
    input.addEventListener("keydown", function () { if (typing) { clearInterval(typing); typing = null; } }, true);

    function clickRun(e) {
      var b = e.target.closest("[data-cmd]");
      if (!b) return false;
      e.preventDefault();
      if (b.classList.contains("chip")) typeThenRun(b.getAttribute("data-cmd"));
      else run(b.getAttribute("data-cmd"));
      if (!matchMedia("(pointer: coarse)").matches) input.focus();
      return true;
    }
    win.addEventListener("click", function (e) {
      if (clickRun(e)) return;
      if (e.target.closest("a, button, input")) return;
      if (String(global.getSelection && global.getSelection())) return; // let people copy text
      input.focus();
    });

    function markWorkspace(name) {
      var hit = WORKSPACES.filter(function (w) { return w[2] === name || (name === "project" && w[2] === "projects") || (name === "read" && w[2] === "blog"); })[0];
      if (!hit) return;
      [].forEach.call(wsEl.children, function (b) { b.classList.toggle("is-on", b.getAttribute("data-cmd") === hit[2]); });
    }
    WORKSPACES.forEach(function (w, i) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("data-cmd", w[2]); b.title = "Alt+" + w[0];
      b.innerHTML = "<b>" + w[0] + "</b><span>" + w[1] + "</span>";
      if (!i) b.classList.add("is-on");
      wsEl.appendChild(b);
    });
    document.addEventListener("keydown", function (e) {
      if (e.altKey && /^[1-5]$/.test(e.key)) { e.preventDefault(); run(WORKSPACES[+e.key - 1][2]); }
      var row = e.target.closest && e.target.closest("tr[data-cmd]");
      if (row && e.key === "Enter") run(row.getAttribute("data-cmd"));
    });
    document.addEventListener("click", function (e) {
      if (win.contains(e.target)) return;
      var b = e.target.closest("[data-cmd]");
      if (b) { e.preventDefault(); run(b.getAttribute("data-cmd")); }
    });
    var started = Date.now();
    function tickMods() {
      var m = Math.floor((Date.now() - started) / 60000);
      document.getElementById("mod-up").textContent = "up " + (m < 60 ? m + "m" : Math.floor(m / 60) + "h " + (m % 60) + "m");
      document.getElementById("mod-net").textContent = "net: " + (navigator.onLine ? "online" : "offline");
      document.getElementById("mod-date").textContent = new Date().toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
    }
    if (navigator.getBattery) navigator.getBattery().then(function (b) {
      var el = document.getElementById("mod-bat");
      var paint = function () { el.hidden = false; el.textContent = "bat: " + Math.round(b.level * 100) + "%" + (b.charging ? " +" : ""); };
      paint(); b.addEventListener("levelchange", paint); b.addEventListener("chargingchange", paint);
    }).catch(function () {});
    tickMods();
    setInterval(tickMods, 30000);
    function tickClocks() {
      document.getElementById("clock-kol").textContent = kolTime();
      document.getElementById("clock-you").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    tickClocks();
    setInterval(tickClocks, 15000);
    var tiled = !embedded && matchMedia("(min-width: 861px)").matches;
    if (tiled) {
      renderFetch(document.getElementById("fetch"));
      renderTop(document.getElementById("top"));
    }

    ["help", "ls", "projects", "work", "contact", "↑"].forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c;
      if (c === "↑") b.addEventListener("click", function () { if (history.length) { input.value = history[history.length - 1]; paintGhost(); input.focus(); } });
      else b.setAttribute("data-cmd", c);
      chips.appendChild(b);
    });

    // ---------- start ----------
    var last = new Date(Date.now() - 1000 * 60 * 47);
    entry(null, '<p class="k-dim">Welcome to ShoryaOS (arch, btw) · tty1<br>Last login: ' + esc(last.toDateString()) + " " + esc(last.toTimeString().slice(0, 5)) + " from your browser</p>");
    entry("screenfetch", rich.run("screenfetch", []).html);
    var first = new URLSearchParams(global.location.search).get("cmd") || decodeURIComponent((global.location.hash || "").slice(1)).replace(/-/g, " ");
    if (first) run(first);
    syncPrompt();
    if (!matchMedia("(pointer: coarse)").matches) input.focus();

    return { run: run, getState: function () { return state; } };
  }

  global.TerminalUI = { mount: mount };
})(typeof self !== "undefined" ? self : this);
