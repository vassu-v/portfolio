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

  function portraitInto(pre) {
    var img = new Image();
    img.onload = function () {
      var cols = 44, rows = 30;
      var c = document.createElement("canvas");
      c.width = cols; c.height = rows;
      var ctx = c.getContext("2d");
      var s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, Math.max(0, (img.height - s) * 0.15), s, s, 0, 0, cols, rows);
      var px = ctx.getImageData(0, 0, cols, rows).data;
      var ramp = " .:-=+*#%@";
      var out = "";
      for (var y = 0; y < rows; y++) {
        var run = "", cls = "";
        for (var x = 0; x < cols; x++) {
          var i = (y * cols + x) * 4;
          var l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
          l = Math.min(1, Math.max(0, (l - 0.12) * 1.35));
          var ch = ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length))];
          var k = l < 0.25 ? "a1" : l < 0.5 ? "a2" : l < 0.78 ? "a3" : "a4";
          if (k !== cls) { if (run) out += '<span class="' + cls + '">' + esc(run) + "</span>"; run = ""; cls = k; }
          run += ch;
        }
        out += '<span class="' + cls + '">' + esc(run) + "</span>\n";
      }
      pre.innerHTML = out;
    };
    img.src = "/preview (1).jpg";
  }

  function mount(win) {
    var log = win.querySelector("#log");
    var input = win.querySelector("#cmd");
    var form = win.querySelector("#promptbar");
    var ghostTyped = win.querySelector(".ghost__typed");
    var ghostRest = win.querySelector(".ghost__rest");
    var promptPath = win.querySelector(".p-path");
    var titlePath = win.querySelector("#title-path");
    var chips = win.querySelector("#chips");
    var embedded = global.top !== global.self;
    if (embedded) document.documentElement.classList.add("embedded");

    var state = engine.initialState();
    var history = [];
    var cursor = null;
    var suggestion = "";

    // ---------- theme ----------
    function setTheme(t) {
      if (!t || t === "copper") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem(THEME_KEY, t || "copper"); } catch (e) { /* storage blocked */ }
    }
    try { setTheme(localStorage.getItem(THEME_KEY)); } catch (e) { /* storage blocked */ }

    // ---------- output ----------
    function entry(echo, html) {
      var div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = (echo !== null ? '<div class="echo"><span class="p-arrow">❯</span> <b>' + esc(echo) + "</b></div>" : "") + (html || "");
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

    CHIPS.concat(["theme"]).forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c; b.setAttribute("data-cmd", c);
      chips.appendChild(b);
    });
    var home = document.createElement("a");
    home.className = "chip"; home.href = "/"; home.textContent = "3D room ↗";
    if (!embedded) chips.appendChild(home);

    // ---------- start ----------
    entry(null, rich.run("welcome", []).html);
    var first = new URLSearchParams(global.location.search).get("cmd") || decodeURIComponent((global.location.hash || "").slice(1)).replace(/-/g, " ");
    if (first) run(first);
    syncPrompt();
    if (!matchMedia("(pointer: coarse)").matches) input.focus();

    return { run: run, getState: function () { return state; } };
  }

  global.TerminalUI = { mount: mount };
})(typeof self !== "undefined" ? self : this);
