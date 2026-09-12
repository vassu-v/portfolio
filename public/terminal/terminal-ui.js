/**
 * terminal-ui.js
 *
 * DOM-driving render layer for TerminalEngine (terminal-engine.js). This
 * file is the ONLY place that touches the DOM — the engine stays pure.
 *
 * Mount with:
 *   TerminalUI.mount(document.getElementById('terminal-root'));
 *
 * Expects these CSS custom properties to exist on the mounted root (see
 * terminal.html) — this file mutates them live to make `theme`/`font`
 * visibly change the rendered terminal, which the Python prototype could
 * never do:
 *   --term-fg     (theme command -> hex color)
 *   --term-font   (font command  -> font-family stack)
 */
(function (global) {
  "use strict";

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Real portrait, ASCII-rendered so it stays "in system" (monospace
  // character art) rather than breaking the terminal illusion with a
  // normal floating <img> — shown once during boot, per design research.
  // v3: compact portrait — replaces both the earlier partial (only showed
  // the top of the head) and oversized (100+ cols, way too big) versions.
  // Same art now used on the curl side (api/cli.py's ASCII_PORTRAIT_LINES).
  var ASCII_PORTRAIT = [
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
  ].join("\n");

  // UI-only glyph table for the boot splash's name banner — deliberately
  // NOT shared with terminal-engine.js's own banner/figlet command glyphs;
  // that file stays a byte-for-byte content mirror of the Python original
  // (verified by an independent review pass), so presentation-only assets
  // like this live here instead.
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

  function renderNameBanner() {
    var rows = ["", "", "", "", ""];
    for (var i = 0; i < BANNER_WORD.length; i++) {
      var glyph = BANNER_FONT[BANNER_WORD[i]] || BANNER_FONT[" "];
      for (var r = 0; r < 5; r++) rows[r] += glyph[r] + " ";
    }
    return rows.map(function (r) { return r.replace(/\s+$/, ""); }).join("\n");
  }

  function mount(root) {
    var engine = global.TerminalEngine;
    if (!engine) throw new Error("TerminalUI.mount: TerminalEngine not found — load terminal-engine.js first");

    var state = engine.initialState();
    var historyCursor = null; // index into inputHistory while scrolling with up/down
    var inputHistory = []; // separate from engine's command_history: purely for arrow recall

    // No title bar / traffic-light chrome, deliberately — per direct
    // feedback and reference research (Alacritty/kitty/xterm defaults,
    // real raw-terminal portfolio sites): that "app window" framing is
    // the single strongest signal of a fake mockup vs. a real terminal.
    root.innerHTML =
      '<div class="term-window">' +
      '  <div class="term-body" id="term-body">' +
      '    <div class="term-log" id="term-log"></div>' +
      '    <div class="term-inputline" id="term-inputline">' +
      '      <span class="term-prompt" id="term-prompt"></span>' +
      '      <span class="term-input-wrap">' +
      '        <input class="term-input" id="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />' +
      '        <span class="term-mirror" id="term-mirror" aria-hidden="true"></span>' +
      '        <span class="term-charwidth" id="term-charwidth" aria-hidden="true">0</span>' +
      '        <span class="term-cursor" id="term-cursor">&nbsp;</span>' +
      '      </span>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    var logEl = root.querySelector("#term-log");
    var inputEl = root.querySelector("#term-input");
    var promptEl = root.querySelector("#term-prompt");
    var inputLineEl = root.querySelector("#term-inputline");
    var bodyEl = root.querySelector("#term-body");
    var mirrorEl = root.querySelector("#term-mirror");
    var charWidthEl = root.querySelector("#term-charwidth");
    var cursorEl = root.querySelector("#term-cursor");

    function updateCursorPosition() {
      // Block cursor sits AT the actual caret position (measured via a
      // hidden same-font mirror span containing only the text up to
      // selectionStart — bug fixed: this used to mirror the whole value
      // regardless of caret position, so it never moved off the end).
      //
      // Width is one real character cell (measured once via a hidden
      // same-font span), and the cursor overlays — rather than sits in the
      // gap beside — the character at that position: `mix-blend-mode:
      // difference` in the CSS inverts whatever text pixel is underneath
      // it, so the letter stays fully legible (just color-flipped) instead
      // of being hidden by an opaque block.
      var caretPos = inputEl.selectionStart == null ? inputEl.value.length : inputEl.selectionStart;
      mirrorEl.textContent = inputEl.value.slice(0, caretPos);
      cursorEl.style.transform = "translateX(" + mirrorEl.offsetWidth + "px)";
      cursorEl.style.width = charWidthEl.offsetWidth + "px";
    }

    function applyThemeFont() {
      var fg = engine.THEMES[state.theme] || engine.THEMES.default;
      var fontFamily = engine.FONTS[state.font] || engine.FONTS.default;
      root.style.setProperty("--term-fg", fg);
      root.style.setProperty("--term-font", fontFamily);
    }

    function scrollToBottom() {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    function appendLine(html, extraClass) {
      var div = document.createElement("div");
      div.className = "term-line" + (extraClass ? " " + extraClass : "");
      div.innerHTML = html;
      logEl.appendChild(div);
    }

    function appendCommandEcho(promptText, commandText) {
      appendLine(
        '<span class="term-echo-prompt">' + escapeHtml(promptText) + "</span>" +
        '<span class="term-echo-cmd">' + escapeHtml(commandText) + "</span>"
      );
    }

    function appendOutput(text) {
      if (text === "") return;
      var lines = text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        appendLine(escapeHtml(lines[i]) || "&nbsp;", "term-output");
      }
    }

    function clearLog() {
      logEl.innerHTML = "";
    }

    function renderPromptLine() {
      if (state.awaiting_password) {
        promptEl.textContent = "[sudo] password for visitor: ";
        inputEl.type = "password";
        inputLineEl.classList.remove("term-nano-mode");
      } else if (state.in_editor) {
        promptEl.textContent = "";
        inputEl.type = "text";
        inputLineEl.classList.add("term-nano-mode");
      } else {
        promptEl.textContent = engine.prompt(state.cwd);
        inputEl.type = "text";
        inputLineEl.classList.remove("term-nano-mode");
      }
    }

    function renderNanoBanner(on, filename) {
      var existing = root.querySelector(".term-nano-banner");
      if (existing) existing.remove();
      if (!on) return;
      var banner = document.createElement("div");
      banner.className = "term-nano-banner";
      banner.textContent = "-- EDITING " + filename + " (session-only) -- type :wq to save+exit, :q to discard+exit --";
      inputLineEl.parentNode.insertBefore(banner, inputLineEl);
    }

    function submit(raw) {
      var wasEditor = !!state.in_editor;
      var wasPassword = !!state.awaiting_password;
      var promptText = wasPassword
        ? "[sudo] password for visitor: "
        : wasEditor
        ? ""
        : engine.prompt(state.cwd);

      if (!wasEditor) {
        appendCommandEcho(promptText, wasPassword ? "*".repeat(raw.length) : raw);
      } else {
        appendCommandEcho("", raw);
      }

      var result = engine.processCommand(state, raw);
      state = result[0];
      var output = result[1];

      if (!wasEditor && !wasPassword && raw.trim() !== "") {
        inputHistory.push(raw);
      }
      historyCursor = null;

      var isSudoPromptOutput = state.awaiting_password && output === "[sudo] password for visitor: ";

      if (state.clear) {
        clearLog();
      } else if (output && !isSudoPromptOutput) {
        // the sudo prompt text is rendered as the next input row's prompt
        // instead of a log line, to avoid showing it twice.
        appendOutput(output);
      }

      applyThemeFont();
      renderPromptLine();
      renderNanoBanner(!!state.in_editor, state.in_editor ? state.in_editor.display : "");
      scrollToBottom();

      if (state.should_exit) {
        inputEl.disabled = true;
        appendLine('<span class="term-exited">-- session ended. reload the page to start a new one --</span>');
      }
    }

    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var val = inputEl.value;
        inputEl.value = "";
        submit(val);
        updateCursorPosition();
        return;
      }
      if (e.key === "ArrowUp") {
        if (!inputHistory.length) return;
        e.preventDefault();
        if (historyCursor === null) historyCursor = inputHistory.length;
        historyCursor = Math.max(0, historyCursor - 1);
        inputEl.value = inputHistory[historyCursor];
        updateCursorPosition();
        return;
      }
      if (e.key === "ArrowDown") {
        if (historyCursor === null) return;
        e.preventDefault();
        historyCursor += 1;
        if (historyCursor >= inputHistory.length) {
          historyCursor = null;
          inputEl.value = "";
        } else {
          inputEl.value = inputHistory[historyCursor];
        }
        updateCursorPosition();
        return;
      }
    });

    inputEl.addEventListener("input", updateCursorPosition);
    // Caret can move without the value changing (arrow keys, Home/End,
    // clicking mid-text) — these need their own listeners since "input"
    // only fires on a value change.
    inputEl.addEventListener("keyup", updateCursorPosition);
    inputEl.addEventListener("click", updateCursorPosition);
    inputEl.addEventListener("focus", updateCursorPosition);

    root.addEventListener("click", function () {
      if (!inputEl.disabled) inputEl.focus();
    });

    // ── Boot sequence ──────────────────────────────────────────────────
    // Staggered fake boot lines + the ASCII portrait before the shell
    // becomes interactive — sells the "real machine" illusion instead of
    // dropping straight into a prompt. Purely cosmetic, no engine state
    // involved.
    var BOOT_LINES = [
      "booting ShoryaOS kernel...",
      "mounting /home/shorya...              [ OK ]",
      "starting personality module...        [ OK ]",
      "loading portfolio-terminal shell...    [ OK ]",
    ];

    function bootSequence(done) {
      inputEl.disabled = true;
      var i = 0;
      function next() {
        if (i < BOOT_LINES.length) {
          appendLine(escapeHtml(BOOT_LINES[i]), "term-boot-line");
          i++;
          scrollToBottom();
          setTimeout(next, 140);
          return;
        }
        appendLine('<pre class="term-banner-gradient">' + escapeHtml(renderNameBanner()) + "</pre>");
        appendLine('<pre class="term-ascii">' + escapeHtml(ASCII_PORTRAIT) + "</pre>");
        appendOutput("Type `help` to see available commands. Type `exit` to leave.");
        inputEl.disabled = false;
        scrollToBottom();
        inputEl.focus();
        done && done();
      }
      setTimeout(next, 120);
    }

    applyThemeFont();
    renderPromptLine();
    updateCursorPosition();
    bootSequence();

    return {
      getState: function () { return state; },
    };
  }

  global.TerminalUI = { mount: mount };
})(typeof window !== "undefined" ? window : this);
