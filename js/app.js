/* Stage 3 English – mācību platforma (vārdu apguve) */
(function () {
  "use strict";

  const DATA = window.VOCABULARY || { groups: [] };
  // A "group" is one entry of the material: one or more headwords + their questions and answers.
  const WORDS = (DATA.groups || []).filter((g) => g && g.words && g.words.length && g.qa && g.qa.length);
  WORDS.forEach((g) => { g.word = g.words.map((w) => w.word).join(" · "); });
  const STORE_KEY = "stage3.vocab.v3";
  const SETTINGS_KEY = "stage3.settings.v2";
  const app = document.getElementById("app");
  const titleEl = document.getElementById("title");
  const backBtn = document.getElementById("backBtn");

  /* ---------- storage (safe) ---------- */
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  // stats[itemKey] = { c: correct, w: wrong, last: true|false }
  let stats = load(STORE_KEY, {});
  let settings = Object.assign({ dir: "qa" }, load(SETTINGS_KEY, {}));

  /* ---------- daily activity (time, answers, learned words) ---------- */
  const ACT_KEY = "stage3.activity.v1";
  let activity = Object.assign({ days: {}, learned: {} }, load(ACT_KEY, {}));
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dayKey(new Date());
  function dayRec(k) {
    k = k || today();
    if (!activity.days[k]) activity.days[k] = { ms: 0, answers: 0, correct: 0, words: 0 };
    return activity.days[k];
  }
  const saveActivity = () => save(ACT_KEY, activity);

  // Time counts only while the app is open on screen and the user did something in the last 90 s.
  let lastInput = Date.now(), lastTick = Date.now();
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((ev) => window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true }));
  function tick() {
    const now = Date.now();
    const dt = now - lastTick;
    lastTick = now;
    if (document.visibilityState === "visible" && now - lastInput < 90000 && dt > 0 && dt < 30000) {
      dayRec().ms += dt;
      saveActivity();
    }
  }
  setInterval(tick, 5000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { lastTick = Date.now(); lastInput = Date.now(); } else tick(); });

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const DIRS = { qa: "Jautājums → atbilde", aq: "Atbilde → jautājums" };
  const itemKey = (wi, qi, dir) => `${WORDS[wi].word}|${qi}|${dir}`;
  const mainAnswer = (pair) => pair.a[0];

  const ICONS = {
    words: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6.5A2.5 2.5 0 0 0 4 20.5 2.5 2.5 0 0 0 6.5 23H19v-5"/><path d="M8 7h7M8 11h5"/></svg>',
    dictation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'
  };

  /* ---------- speech ---------- */
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => /^en(-|_)GB/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
      if (voice) u.voice = voice;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  const speakBtn = (text) => `<button class="speak" data-speak="${esc(text)}" aria-label="Izrunāt">${ICONS.speak}</button>`;

  /* ---------- progress ---------- */
  function wordItems(wi, dir) {
    const w = WORDS[wi];
    const dirs = dir ? [dir] : ["qa", "aq"];
    const out = [];
    (w.qa || []).forEach((_, qi) => dirs.forEach((d) => out.push(itemKey(wi, qi, d))));
    return out;
  }
  function wordProgress(wi, dir) {
    const items = wordItems(wi, dir);
    if (!items.length) return { pct: 0, wrong: 0, started: false };
    let ok = 0, wrong = 0, started = false;
    items.forEach((k) => { const s = stats[k]; if (s) { started = true; if (s.last) ok++; else wrong++; } });
    return { pct: Math.round((ok / items.length) * 100), wrong, started };
  }
  function overall(dir) {
    let ok = 0, total = 0;
    WORDS.forEach((_, wi) => wordItems(wi, dir).forEach((k) => { total++; if (stats[k] && stats[k].last) ok++; }));
    return total ? Math.round((ok / total) * 100) : 0;
  }
  function mistakeItems(dir) {
    const out = [];
    WORDS.forEach((w, wi) => (w.qa || []).forEach((_, qi) => {
      const s = stats[itemKey(wi, qi, dir)];
      if (s && s.last === false) out.push({ wi, qi });
    }));
    return out;
  }

  /* ---------- questions ---------- */
  function allPairs() {
    const out = [];
    WORDS.forEach((w, wi) => (w.qa || []).forEach((p, qi) => out.push({ wi, qi, q: p.q, a: mainAnswer(p) })));
    return out;
  }

  // One question: in "qa" the prompt is the question and the options are answers; "aq" is the reverse.
  function makeQuestion(wi, qi, dir) {
    const pair = WORDS[wi].qa[qi];
    const field = dir === "qa" ? "a" : "q";
    const correctText = dir === "qa" ? mainAnswer(pair) : pair.q;
    const accepted = new Set(dir === "qa" ? pair.a : [pair.q]);
    const pool = allPairs().filter((p) => !(p.wi === wi && p.qi === qi) && !accepted.has(p[field]));
    // Mix: up to 2 similar options from the same word (harder – tests grammar and meaning), the rest from other words.
    const same = shuffle(pool.filter((p) => p.wi === wi)).slice(0, 2);
    const other = shuffle(pool.filter((p) => p.wi !== wi));
    const seen = new Set([correctText]);
    const distractors = [];
    same.concat(other).forEach((p) => { if (distractors.length < 3 && !seen.has(p[field])) { seen.add(p[field]); distractors.push(p); } });
    const options = shuffle([{ wi, qi, text: correctText }].concat(distractors.map((p) => ({ wi: p.wi, qi: p.qi, text: p[field] }))));
    return { wi, qi, dir, key: itemKey(wi, qi, dir), prompt: dir === "qa" ? pair.q : mainAnswer(pair), answer: correctText, options };
  }

  /* ---------- views ---------- */
  let session = null;

  function setHeader(title, showBack) { titleEl.textContent = title; backBtn.hidden = !showBack; }

  function viewHome() {
    setHeader("Stage 3 English", false);
    app.innerHTML = `
      <p class="lead">Izvēlies sadaļu. Skaidrojumi pie kļūdām tiek sniegti angļu valodā.</p>
      <div class="tiles">
        <button class="tile" data-go="#/vocab">
          <span class="ico">${ICONS.words}</span>
          <span><strong>Vārdiņi</strong><span class="sub">Vocabulary · ${WORDS.length} vārdi · apgūti ${overall()}%</span></span>
          <span class="chev">${ICONS.chev}</span>
        </button>
        <button class="tile" data-go="#/speak">
          <span class="ico">${ICONS.mic}</span>
          <span><strong>Runāšana</strong><span class="sub">Speaking · atbildi uz jautājumu balsī · ${overall("sp")}%</span></span>
          <span class="chev">${ICONS.chev}</span>
        </button>
        <button class="tile" data-go="#/stats">
          <span class="ico">${ICONS.stats}</span>
          <span><strong>Statistika</strong><span class="sub">Šodien: ${fmtTime(dayRec().ms)} · apgūti ${dayRec().words} vārdi</span></span>
          <span class="chev">${ICONS.chev}</span>
        </button>
        <button class="tile" disabled>
          <span class="ico">${ICONS.dictation}</span>
          <span><strong>Diktāti</strong><span class="sub">Dictations</span></span>
          <span class="badge">Drīzumā</span>
        </button>
        <button class="tile" disabled>
          <span class="ico">${ICONS.tasks}</span>
          <span><strong>Uzdevumi</strong><span class="sub">Exercises</span></span>
          <span class="badge">Drīzumā</span>
        </button>
      </div>`;
  }

  let searchText = "";
  function viewVocab() {
    setHeader("Vārdiņi", true);
    if (!WORDS.length) { app.innerHTML = `<p class="empty">Vārdu saraksts vēl nav pievienots.</p>`; return; }
    const dir = settings.dir;
    const mistakes = mistakeItems(dir).length;
    const pct = overall(dir);

    app.innerHTML = `
      <div class="seg" data-seg="dir">${Object.entries(DIRS).map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === dir}">${l}</button>`).join("")}</div>
      <div class="card stats">
        <div class="stat"><b>${pct}%</b><span>apgūts</span></div>
        <div class="stat"><b>${WORDS.filter((_, wi) => wordProgress(wi, dir).pct === 100).length}/${WORDS.length}</b><span>vārdi</span></div>
        <div class="stat ${mistakes ? "bad" : ""}"><b>${mistakes}</b><span>kļūdas</span></div>
        <span class="bar wide"><i style="width:${pct}%"></i></span>
      </div>
      <button class="btn danger" id="review" ${mistakes ? "" : "disabled"}>Atkārtot kļūdas (${mistakes})</button>
      <button class="btn secondary" id="mixed">Jaukti jautājumi no visiem vārdiem</button>
      <p class="section-label">Vārdi</p>
      <input class="search" id="search" type="search" placeholder="Meklēt vārdu (angliski vai latviski)…" value="${esc(searchText)}" autocomplete="off" autocapitalize="off">
      <div class="word-list" id="list"></div>
      <button class="btn secondary" id="reset" style="background:none;color:var(--muted);font-weight:500">Dzēst progresu</button>`;

    const renderList = () => {
      const q = searchText.trim().toLowerCase();
      const rows = WORDS.map((w, wi) => ({ w, wi })).filter(({ w }) => !q || w.word.toLowerCase().includes(q) || w.words.some((x) => (x.translation || "").toLowerCase().includes(q)));
      document.getElementById("list").innerHTML = rows.length ? rows.map(({ w, wi }) => {
        const p = wordProgress(wi, dir);
        const status = p.wrong ? "bad" : p.pct === 100 ? "ok" : p.started ? "mid" : "";
        return `<button class="word-row" data-go="#/word/${wi}">
            <span class="dot ${status}" aria-hidden="true"></span>
            <span class="wr-main"><strong>${esc(w.word)}</strong><span class="bar"><i style="width:${p.pct}%"></i></span></span>
            <span class="wr-pct">${p.wrong ? `<span class="err">${p.wrong} ✗</span>` : `${p.pct}%`}</span>
            <span class="chev">${ICONS.chev}</span>
          </button>`;
      }).join("") : `<p class="empty">Nekas netika atrasts.</p>`;
    };
    renderList();

    document.getElementById("search").addEventListener("input", (e) => { searchText = e.target.value; renderList(); });
    app.querySelector(".seg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      settings.dir = b.dataset.v; save(SETTINGS_KEY, settings); viewVocab();
    });
    document.getElementById("review").addEventListener("click", () => {
      startSession(shuffle(mistakeItems(dir)).map((x) => makeQuestion(x.wi, x.qi, dir)), { title: "Kļūdu atkārtošana", back: "#/vocab" });
    });
    document.getElementById("mixed").addEventListener("click", () => {
      // Priority: wrong answers first, then never answered, then the rest.
      const items = allPairs().map((p) => {
        const s = stats[itemKey(p.wi, p.qi, dir)];
        const started = wordProgress(p.wi, dir).started;
        const prio = s && s.last === false ? 3 : !s && started ? 2 : !s ? 1 : 0;
        return { p, prio: prio + Math.random() };
      }).sort((a, b) => b.prio - a.prio).slice(0, 10);
      startSession(shuffle(items).map(({ p }) => makeQuestion(p.wi, p.qi, dir)), { title: "Jaukti jautājumi", back: "#/vocab" });
    });
    document.getElementById("reset").addEventListener("click", () => {
      if (confirm("Vai tiešām dzēst visu vārdu apguves progresu?")) { stats = {}; save(STORE_KEY, stats); activity.learned = {}; saveActivity(); viewVocab(); }
    });
  }

  function viewWord(wi) {
    const g = WORDS[wi];
    if (!g) { location.replace("#/vocab"); return; }
    setHeader("Vārdiņi", true);
    const dir = settings.dir;
    const p = wordProgress(wi, dir);
    const n = g.qa.length;
    const words = g.words.map((w) => `
        <div class="headword">
          <p class="prompt prompt-word">${esc(w.word)}${speakBtn(w.word)}</p>
          ${w.pos ? `<span class="pos">${esc(w.pos)}</span>` : ""}
          <p class="explanation">${esc(w.explanation || "")}</p>
          ${w.translation ? `<p class="lv">LV: ${esc(w.translation)}</p>` : ""}
        </div>`).join("");
    const tables = (g.tables || []).length ? `<div class="forms">${g.tables.map((t) => `<div>${esc(t)}</div>`).join("")}</div>` : "";
    const example = g.qa[0];
    app.innerHTML = `
      <div class="card word-card">
        <p class="qtype">${wi + 1} / ${WORDS.length}${g.page ? ` · lpp. ${esc(g.page)}` : ""}</p>
        ${words}
        ${tables}
        <div class="sample">
          <p class="label">Example from the book</p>
          <p><b>Q:</b> ${esc(example.q)}</p>
          <p><b>A:</b> ${esc(example.a[0])}</p>
        </div>
      </div>
      <p class="hint">${n} ${n === 1 ? "jautājums" : "jautājumi"} · ${DIRS[dir]} · apgūts ${p.pct}%</p>
      <button class="btn" id="know">${g.words.length > 1 ? "I know these words" : "I know this word"}</button>
      <div class="pager">
        <button class="btn secondary" data-go="#/word/${(wi - 1 + WORDS.length) % WORDS.length}">← Iepriekšējais</button>
        <button class="btn secondary" data-go="#/word/${(wi + 1) % WORDS.length}">Nākamais →</button>
      </div>`;
    document.getElementById("know").addEventListener("click", () => {
      const qs = shuffle(g.qa.map((_, qi) => makeQuestion(wi, qi, dir)));
      startSession(qs, { title: g.word, back: `#/word/${wi}`, wi });
    });
  }

  /* ---------- statistics ---------- */
  function fmtTime(ms) {
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)} h ${pad(m % 60)} min`;
  }
  function lastDays(n) {
    const out = [];
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      const k = dayKey(x);
      out.push({ k, d: x, r: activity.days[k] || { ms: 0, answers: 0, correct: 0, words: 0 } });
    }
    return out;
  }
  const active = (r) => r && (r.ms >= 60000 || r.answers > 0);
  function streak() {
    let n = 0;
    const d = new Date();
    if (!active(activity.days[dayKey(d)])) d.setDate(d.getDate() - 1); // today not started yet – count from yesterday
    while (active(activity.days[dayKey(d)])) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const WEEKDAYS = ["Sv", "P", "O", "T", "C", "Pk", "S"];

  // Single-series bar chart (SVG) with tap/hover tooltip.
  function barChart(id, days, value, fmt, unit) {
    const W = 340, H = 150, L = 28, B = 22, T = 10;
    const vals = days.map((x) => value(x.r));
    const max = Math.max(1, ...vals);
    const step = max <= 5 ? 1 : Math.ceil(max / 4 / 5) * 5;
    const top = Math.ceil(max / step) * step;
    const n = days.length, slot = (W - L) / n, bw = Math.max(4, slot - 4);
    const y = (v) => T + (H - T - B) * (1 - v / top);
    let grid = "";
    for (let v = 0; v <= top; v += step) {
      grid += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid${v === 0 ? " base" : ""}"/>` +
              `<text x="${L - 6}" y="${y(v) + 4}" class="tick" text-anchor="end">${v}</text>`;
    }
    const bars = days.map((x, i) => {
      const v = vals[i], bx = L + i * slot + (slot - bw) / 2, by = y(v), h = (H - B) - by;
      const r = Math.min(4, bw / 2, h);
      const path = v > 0 ? `M${bx},${H - B} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + bw - r} Q${bx + bw},${by} ${bx + bw},${by + r} V${H - B} Z` : "";
      const label = (i % 2 === (n - 1) % 2) ? `<text x="${bx + bw / 2}" y="${H - 6}" class="tick" text-anchor="middle">${x.d.getDate()}.${pad(x.d.getMonth() + 1)}</text>` : "";
      const tip = `${WEEKDAYS[x.d.getDay()]}, ${x.d.getDate()}.${pad(x.d.getMonth() + 1)}: ${fmt(v)}`;
      return `<g class="barg${x.k === today() ? " today" : ""}" data-tip="${esc(tip)}" data-x="${bx + bw / 2}" data-y="${by}">
          <rect x="${L + i * slot}" y="${T}" width="${slot}" height="${H - T - B}" class="hit"/>
          ${path ? `<path d="${path}" class="bar-mark"/>` : ""}${label}</g>`;
    }).join("");
    return `<div class="chart" id="${id}">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(unit)} pēdējās ${n} dienās">${grid}${bars}</svg>
        <div class="tip" hidden></div>
      </div>`;
  }

  function wireChart(el) {
    const tip = el.querySelector(".tip"), svg = el.querySelector("svg");
    const show = (g) => {
      el.querySelectorAll(".barg.on").forEach((x) => x.classList.remove("on"));
      g.classList.add("on");
      tip.textContent = g.dataset.tip;
      tip.hidden = false;
      const sx = svg.clientWidth / 340, sy = svg.clientHeight / 150;
      const left = Math.min(Math.max(Number(g.dataset.x) * sx, 60), svg.clientWidth - 60);
      tip.style.left = left + "px";
      tip.style.top = Math.max(0, Number(g.dataset.y) * sy - 34) + "px";
    };
    el.querySelectorAll(".barg").forEach((g) => {
      g.addEventListener("pointerenter", () => show(g));
      g.addEventListener("click", () => show(g));
    });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { tip.hidden = true; el.querySelectorAll(".barg.on").forEach((x) => x.classList.remove("on")); } });
  }

  function viewStats() {
    tick();
    setHeader("Statistika", true);
    const t = dayRec(), days = lastDays(14), week = days.slice(-7);
    const totalWords = WORDS.reduce((n, g) => n + g.words.length, 0);
    const learnedWords = WORDS.filter((g) => activity.learned[g.word]).reduce((n, g) => n + g.words.length, 0);
    const weekMs = week.reduce((n, x) => n + x.r.ms, 0);
    const weekWords = week.reduce((n, x) => n + x.r.words, 0);
    const acc = t.answers ? Math.round((t.correct / t.answers) * 100) + "%" : "–";
    const allDays = Object.keys(activity.days).filter((k) => active(activity.days[k])).sort().reverse();

    app.innerHTML = `
      <p class="section-label" style="margin-top:0">Šodien</p>
      <div class="kpis">
        <div class="kpi"><span>Laiks</span><b>${fmtTime(t.ms)}</b></div>
        <div class="kpi"><span>Apgūti vārdi</span><b>${t.words}</b></div>
        <div class="kpi"><span>Atbildes</span><b>${t.answers}</b></div>
        <div class="kpi"><span>Pareizi</span><b>${acc}</b></div>
      </div>
      <div class="kpis two">
        <div class="kpi"><span>Kopā apgūti</span><b>${learnedWords} <small>/ ${totalWords}</small></b><span class="bar"><i style="width:${Math.round(learnedWords / Math.max(1, totalWords) * 100)}%"></i></span></div>
        <div class="kpi"><span>Dienas pēc kārtas</span><b>${streak()} 🔥</b></div>
      </div>

      <p class="section-label">Laiks dienā (minūtes) · pēdējās 14 dienas</p>
      <div class="card chart-card">
        <p class="chart-sum">Šonedēļ: <b>${fmtTime(weekMs)}</b> · vidēji ${fmtTime(weekMs / 7)} dienā</p>
        ${barChart("chTime", days, (r) => Math.round(r.ms / 60000), (v) => `${v} min`, "Minūtes")}
      </div>

      <p class="section-label">Apgūtie vārdi dienā · pēdējās 14 dienas</p>
      <div class="card chart-card">
        <p class="chart-sum">Šonedēļ: <b>${weekWords}</b> vārdi</p>
        ${barChart("chWords", days, (r) => r.words, (v) => `${v} vārdi`, "Apgūtie vārdi")}
      </div>

      <p class="section-label">Pa dienām</p>
      ${allDays.length ? `<div class="card day-table"><table>
        <thead><tr><th>Diena</th><th>Laiks</th><th>Vārdi</th><th>Atbildes</th></tr></thead>
        <tbody>${allDays.map((k) => { const r = activity.days[k]; const [yy, mm, dd] = k.split("-");
          return `<tr><td>${dd}.${mm}.${yy}</td><td>${fmtTime(r.ms)}</td><td>${r.words}</td><td>${r.answers}${r.answers ? ` <span class="muted">(${Math.round(r.correct / r.answers * 100)}%)</span>` : ""}</td></tr>`; }).join("")}</tbody>
      </table></div>` : `<p class="empty">Vēl nav datu – sāc mācīties sadaļā “Vārdiņi”.</p>`}
      <p class="hint">Laiks tiek skaitīts, kamēr lietotne ir atvērta un tu tajā darbojies. Vārds skaitās apgūts, kad uz visiem tā jautājumiem (vienā no režīmiem) esi atbildējis pareizi.</p>`;
    app.querySelectorAll(".chart").forEach(wireChart);
  }

  function startSession(questions, opts) {
    if (!questions.length) { alert("Nav jautājumu."); return; }
    session = Object.assign({ queue: questions, i: 0, firstTry: 0, uniq: questions.length, wrong: [], retried: new Set() }, opts);
    if (location.hash === "#/quiz") viewQuiz(); else location.hash = "#/quiz";
  }

  function viewQuiz() {
    if (!session) { location.replace("#/vocab"); return; }
    if (session.i >= session.queue.length) { viewResults(); return; }
    setHeader(session.title, true);
    const q = session.queue[session.i];
    const left = session.queue.length - session.i;
    const done = session.i;
    const pct = Math.round((done / session.queue.length) * 100);
    const label = q.dir === "qa" ? "Choose the correct answer" : "Which question has this answer?";

    app.innerHTML = `
      <div class="progress"><span>Atlikuši: ${left}</span><span class="bar"><i style="width:${pct}%"></i></span><span>✓ ${session.firstTry}/${session.uniq}</span></div>
      ${q.retry ? `<p class="retry-tag">Atkārtojums – iepriekš atbildēji nepareizi</p>` : ""}
      <div class="card">
        <p class="qtype">${label}</p><p class="tag-word">${esc(WORDS[q.wi].word)}</p>
        <p class="prompt">${esc(q.prompt)}</p>
      </div>
      <div class="options">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${LETTERS[i]}</span><span>${esc(o.text)}</span></button>`).join("")}</div>
      <div id="fb"></div>`;
    app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.i))));
  }

  function keyWords(g) {
    return g.words.map((w) => `<p><strong>${esc(w.word)}</strong>${w.pos ? ` <span class="pos">(${esc(w.pos)})</span>` : ""} – ${esc(w.explanation || "")}.</p>`).join("");
  }

  function explain(q, chosen, correct) {
    const g = WORDS[q.wi];
    const pair = g.qa[q.qi];
    const others = pair.a.slice(1);
    if (correct) {
      let h = `<h3>Correct!</h3>`;
      if (q.dir === "qa" && others.length) h += `<p><span class="label">Also correct:</span> ${others.map(esc).join(" / ")}</p>`;
      return h;
    }
    let h = `<h3>Not quite.</h3>`;
    if (q.dir === "qa") {
      h += `<p><span class="label">Question:</span> ${esc(pair.q)}</p><p><span class="label">Correct answer:</span> <strong>${esc(pair.a[0])}</strong></p>`;
      if (others.length) h += `<p><span class="label">Also correct:</span> ${others.map(esc).join(" / ")}</p>`;
    } else {
      h += `<p><span class="label">Answer:</span> ${esc(pair.a[0])}</p><p><span class="label">Correct question:</span> <strong>${esc(pair.q)}</strong></p>`;
    }
    h += `<p class="label" style="margin-top:10px">Key words:</p>${keyWords(g)}`;

    const cg = WORDS[chosen.wi];
    const cp = cg && cg.qa[chosen.qi];
    if (cp) {
      h += `<hr><p><span class="label">Why your choice is wrong:</span> `;
      if (q.dir === "qa") h += `“${esc(chosen.text)}” is the answer to a different question: <em>“${esc(cp.q)}”</em>`;
      else h += `the question “${esc(chosen.text)}” has a different answer: <em>“${esc(cp.a[0])}”</em>`;
      if (chosen.wi === q.wi) h += ` Look carefully at the verb form, the tense and the pronouns – the answer must repeat the question.`;
      else h += ` (word: <strong>${esc(cg.word)}</strong>).`;
      h += `</p>`;
    }
    h += `<p class="lv">Šis jautājums tiks uzdots vēlreiz.</p>`;
    return h;
  }

  function answer(idx) {
    const q = session.queue[session.i];
    if (q.answered) return;
    q.answered = true;
    const chosen = q.options[idx];
    const correct = chosen.text === q.answer;

    const s = stats[q.key] || { c: 0, w: 0 };
    if (correct) s.c++; else s.w++;
    s.last = correct;
    stats[q.key] = s; save(STORE_KEY, stats);

    const rec = dayRec();
    rec.answers++;
    if (correct) rec.correct++;
    const g = WORDS[q.wi];
    if (!activity.learned[g.word] && (wordProgress(q.wi, "qa").pct === 100 || wordProgress(q.wi, "aq").pct === 100)) {
      activity.learned[g.word] = today();
      rec.words += g.words.length;
    }
    saveActivity();

    if (!q.retry && !session.retried.has(q.key)) { if (correct) session.firstTry++; }
    if (!correct) {
      if (!session.retried.has(q.key)) session.wrong.push(q);
      session.retried.add(q.key);
      // Ask the same item again a little later (new option order).
      const again = Object.assign(makeQuestion(q.wi, q.qi, q.dir), { retry: true });
      const pos = Math.min(session.queue.length, session.i + 3);
      session.queue.splice(pos, 0, again);
    }

    app.querySelectorAll(".opt").forEach((b, i) => {
      b.disabled = true;
      if (q.options[i].text === q.answer) b.classList.add("correct");
      else if (i === idx) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    const last = session.i + 1 >= session.queue.length;
    const fb = document.getElementById("fb");
    fb.innerHTML = `<div class="feedback ${correct ? "ok" : "bad"}">${explain(q, chosen, correct)}</div>
      <button class="btn" id="next">${last ? "Rezultāti" : "Tālāk"}</button>`;
    document.getElementById("next").addEventListener("click", () => { session.i++; viewQuiz(); window.scrollTo(0, 0); });
    if (!correct) fb.scrollIntoView({ behavior: "smooth", block: "start" });
    else document.getElementById("next").focus({ preventScroll: true });
  }

  function viewResults() {
    setHeader("Rezultāti", true);
    const total = session.uniq;
    const pct = Math.round((session.firstTry / total) * 100);
    const msg = pct === 100 ? "Excellent! Viss pareizi ar pirmo reizi." : pct >= 80 ? "Great job!" : pct >= 50 ? "Good effort – keep practising." : "Keep going – practice makes perfect.";
    const list = session.wrong.map((q) => {
      const w = WORDS[q.wi], p = w.qa[q.qi];
      return `<div class="mistake"><strong>${esc(w.word)}</strong><span style="display:block">Q: ${esc(p.q)}</span><span style="display:block">A: ${esc(p.a[0])}</span></div>`;
    }).join("");
    const hasNext = session.wi != null;
    app.innerHTML = `
      <div class="card score"><p class="big">${session.firstTry} / ${total}</p><p>pareizi ar pirmo reizi · ${pct}%</p><p>${msg}</p></div>
      ${list ? `<p class="section-label">Kļūdas – tās tika atkārtotas un paliek sadaļā “Atkārtot kļūdas”, līdz atbildēsi pareizi</p><div class="mistakes">${list}</div>` : ""}
      ${hasNext ? `<button class="btn" data-go="#/word/${(session.wi + 1) % WORDS.length}">Nākamais vārds →</button>` : ""}
      <button class="btn ${hasNext ? "secondary" : ""}" data-go="#/vocab">Uz vārdu sarakstu</button>`;
  }

  /* ---------- speaking (question -> spoken answer) ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let sp = null;          // speaking session
  let recog = null;       // active recognizer
  let spSearch = "";

  function spMistakes() {
    const out = [];
    WORDS.forEach((g, wi) => g.qa.forEach((_, qi) => { const s = stats[itemKey(wi, qi, "sp")]; if (s && s.last === false) out.push({ wi, qi }); }));
    return out;
  }

  function viewSpeakHome() {
    setHeader("Runāšana", true);
    const mistakes = spMistakes().length;
    const pct = overall("sp");
    app.innerHTML = `
      <p class="lead">Izlasi jautājumu, nospied <b>🎤</b> un atbildi angliski ar pilnu teikumu – tā kā grāmatā.</p>
      ${SR ? "" : `<div class="notice">Šajā pārlūkā runas atpazīšana nav pieejama. Atbildi var ierakstīt vai izmantot iPhone tastatūras diktēšanas pogu 🎤. Labāk darbojas, ja lietotni atver <b>Safari</b> pārlūkā.</div>`}
      <div class="card stats">
        <div class="stat"><b>${pct}%</b><span>pareizi</span></div>
        <div class="stat"><b>${WORDS.filter((_, wi) => wordProgress(wi, "sp").pct === 100).length}/${WORDS.length}</b><span>kartītes</span></div>
        <div class="stat ${mistakes ? "bad" : ""}"><b>${mistakes}</b><span>kļūdas</span></div>
        <span class="bar wide"><i style="width:${pct}%"></i></span>
      </div>
      <button class="btn" id="spMixed">Jaukti jautājumi (10)</button>
      <button class="btn danger" id="spReview" ${mistakes ? "" : "disabled"}>Atkārtot kļūdas (${mistakes})</button>
      <p class="section-label">Vai izvēlies vārdu</p>
      <input class="search" id="spSearch" type="search" placeholder="Meklēt vārdu…" value="${esc(spSearch)}" autocomplete="off" autocapitalize="off">
      <div class="word-list" id="spList"></div>`;
    const render = () => {
      const q = spSearch.trim().toLowerCase();
      const rows = WORDS.map((g, wi) => ({ g, wi })).filter(({ g }) => !q || g.word.toLowerCase().includes(q));
      document.getElementById("spList").innerHTML = rows.map(({ g, wi }) => {
        const p = wordProgress(wi, "sp");
        const status = p.wrong ? "bad" : p.pct === 100 ? "ok" : p.started ? "mid" : "";
        return `<button class="word-row" data-spword="${wi}">
            <span class="dot ${status}" aria-hidden="true"></span>
            <span class="wr-main"><strong>${esc(g.word)}</strong><span class="bar"><i style="width:${p.pct}%"></i></span></span>
            <span class="wr-pct">${p.wrong ? `<span class="err">${p.wrong} ✗</span>` : `${p.pct}%`}</span>
            <span class="chev">${ICONS.chev}</span></button>`;
      }).join("") || `<p class="empty">Nekas netika atrasts.</p>`;
    };
    render();
    document.getElementById("spSearch").addEventListener("input", (e) => { spSearch = e.target.value; render(); });
    document.getElementById("spList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-spword]"); if (!b) return;
      const wi = Number(b.dataset.spword);
      startSpeak(shuffle(WORDS[wi].qa.map((_, qi) => ({ wi, qi }))), WORDS[wi].word);
    });
    document.getElementById("spMixed").addEventListener("click", () => {
      const items = [];
      WORDS.forEach((g, wi) => g.qa.forEach((_, qi) => {
        const s = stats[itemKey(wi, qi, "sp")];
        const learnedCard = !!activity.learned[g.word] || wordProgress(wi, "qa").started;
        items.push({ wi, qi, prio: (s && s.last === false ? 3 : !s && learnedCard ? 2 : !s ? 1 : 0) + Math.random() });
      }));
      items.sort((a, b) => b.prio - a.prio);
      startSpeak(shuffle(items.slice(0, 10)), "Jaukti jautājumi");
    });
    document.getElementById("spReview").addEventListener("click", () => startSpeak(shuffle(spMistakes()), "Kļūdu atkārtošana"));
  }

  function startSpeak(items, title) {
    if (!items.length) return;
    sp = { queue: items.map((x) => ({ wi: x.wi, qi: x.qi })), i: 0, firstTry: 0, uniq: items.length, wrong: [], retried: new Set(), title };
    if (location.hash === "#/speakq") viewSpeakQ(); else location.hash = "#/speakq";
  }

  function stopRecog() { if (recog) { try { recog.abort(); } catch (e) { /* ignore */ } recog = null; } }

  function viewSpeakQ() {
    stopRecog();
    if (!sp) { location.replace("#/speak"); return; }
    if (sp.i >= sp.queue.length) { viewSpeakResults(); return; }
    setHeader(sp.title, true);
    const item = sp.queue[sp.i];
    const g = WORDS[item.wi], pair = g.qa[item.qi];
    const pct = Math.round((sp.i / sp.queue.length) * 100);
    app.innerHTML = `
      <div class="progress"><span>Atlikuši: ${sp.queue.length - sp.i}</span><span class="bar"><i style="width:${pct}%"></i></span><span>✓ ${sp.firstTry}/${sp.uniq}</span></div>
      ${item.retry ? `<p class="retry-tag">Atkārtojums – mēģini vēlreiz</p>` : ""}
      <div class="card">
        <p class="qtype">Answer the question</p><p class="tag-word">${esc(g.word)}</p>
        <p class="prompt">${esc(pair.q)}${speakBtn(pair.q)}</p>
      </div>
      <div class="mic-area" id="micArea">
        ${SR ? `<button class="mic" id="mic" aria-label="Runāt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
        <p class="mic-hint" id="micHint">Nospied un runā</p>` : ""}
        <p class="heard" id="heard"></p>
        <form class="typed" id="typed" ${SR ? "hidden" : ""}>
          <input id="typedIn" type="text" placeholder="Ieraksti vai diktē atbildi…" autocomplete="off" autocapitalize="sentences" enterkeyhint="done">
          <button class="btn" type="submit">Pārbaudīt</button>
        </form>
        ${SR ? `<button class="linkbtn" id="toType">Ierakstīt atbildi</button>` : ""}
        <button class="linkbtn" id="showAns">Parādīt atbildi</button>
      </div>
      <div id="fb"></div>`;

    document.getElementById("typed").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = document.getElementById("typedIn").value.trim();
      if (v) evaluateSpoken([v]);
    });
    const toType = document.getElementById("toType");
    if (toType) toType.addEventListener("click", () => { document.getElementById("typed").hidden = false; toType.hidden = true; document.getElementById("typedIn").focus(); });
    document.getElementById("showAns").addEventListener("click", (e) => {
      e.target.outerHTML = `<p class="peek">${pair.a.map(esc).join("<br><span class='muted'>or:</span> ")}</p>`;
      item.peeked = true;
    });
    const mic = document.getElementById("mic");
    if (mic) mic.addEventListener("click", () => (recog ? recog.stop() : listen()));
  }

  function listen() {
    const mic = document.getElementById("mic"), hint = document.getElementById("micHint"), heard = document.getElementById("heard");
    let finalAlts = null, gotAny = false;
    try {
      recog = new SR();
    } catch (e) { hint.textContent = "Runas atpazīšana nav pieejama – ieraksti atbildi."; showTyped(); return; }
    recog.lang = "en-GB";
    recog.interimResults = true;
    recog.maxAlternatives = 5;
    recog.continuous = false;
    recog.onstart = () => { mic.classList.add("on"); hint.textContent = "Klausos… nospied vēlreiz, kad pabeidz"; heard.textContent = ""; };
    recog.onresult = (e) => {
      gotAny = true;
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      heard.textContent = "“" + text.trim() + "”";
      const last = e.results[e.results.length - 1];
      if (last.isFinal) {
        // Build alternatives: full text with each alternative of the last segment.
        const head = Array.from(e.results).slice(0, -1).map((r) => r[0].transcript).join(" ");
        finalAlts = Array.from(last).map((alt) => (head + " " + alt.transcript).trim());
      }
    };
    recog.onerror = (e) => {
      const msg = { "not-allowed": "Nav atļauts izmantot mikrofonu. Atļauj to iestatījumos vai ieraksti atbildi.",
        "service-not-allowed": "Runas atpazīšana nav pieejama (iPhone: ieslēdz Iestatījumi → Vispārīgi → Tastatūra → Iespējot diktēšanu). Vari ierakstīt atbildi.",
        "no-speech": "Neko nedzirdēju – mēģini vēlreiz.", "audio-capture": "Mikrofons nav pieejams.", "network": "Runas atpazīšanai vajag interneta savienojumu." }[e.error];
      hint.textContent = msg || "Kļūda: " + e.error;
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") showTyped();
    };
    recog.onend = () => {
      mic.classList.remove("on");
      recog = null;
      const text = heard.textContent.replace(/^“|”$/g, "").trim();
      if (finalAlts && finalAlts.length) evaluateSpoken(finalAlts);
      else if (gotAny && text) evaluateSpoken([text]);
      else if (hint.textContent.startsWith("Klausos")) hint.textContent = "Nospied un runā";
    };
    try { recog.start(); } catch (e) { hint.textContent = "Neizdevās ieslēgt mikrofonu – ieraksti atbildi."; showTyped(); }
  }
  function showTyped() {
    const f = document.getElementById("typed"), t = document.getElementById("toType");
    if (f) f.hidden = false;
    if (t) t.hidden = true;
  }

  function renderDiff(ops) {
    return ops.map((o) => {
      if (o.op === "ok") return `<span class="w">${esc(o.exp)}</span>`;
      if (o.op === "near") return `<span class="w near" title="you said: ${esc(o.got)}">${esc(o.exp)}</span>`;
      if (o.op === "wild") return o.got.length ? `<span class="w own">${esc(o.got.join(" "))}</span>` : `<span class="w own">…</span>`;
      if (o.op === "miss") return `<span class="w miss">${esc(o.exp)}</span>`;
      if (o.op === "sub") return `<span class="w got">${esc(o.got)}</span><span class="w miss">${esc(o.exp)}</span>`;
      if (o.op === "extra") return `<span class="w got">${esc(o.got)}</span>`;
      return "";
    }).join(" ");
  }

  function evaluateSpoken(alts) {
    const item = sp.queue[sp.i];
    if (item.done) return;
    const g = WORDS[item.wi], pair = g.qa[item.qi];
    const r = window.AnswerMatch.check(pair.a, alts);
    finishSpoken(item, r.ok, r, alts[0]);
  }

  function finishSpoken(item, correct, r, said, overridden) {
    item.done = true;
    const g = WORDS[item.wi], pair = g.qa[item.qi];
    const key = itemKey(item.wi, item.qi, "sp");
    const s = stats[key] || { c: 0, w: 0 };
    if (overridden) { s.w = Math.max(0, s.w - 1); }
    if (correct) s.c++; else s.w++;
    s.last = correct;
    stats[key] = s; save(STORE_KEY, stats);
    const rec = dayRec();
    if (!overridden) rec.answers++;
    if (correct) rec.correct++;
    saveActivity();

    if (!overridden) {
      if (!item.retry && !sp.retried.has(key) && correct && !item.peeked) sp.firstTry++;
      if (!correct) {
        if (!sp.retried.has(key)) sp.wrong.push(item);
        sp.retried.add(key);
        sp.queue.splice(Math.min(sp.queue.length, sp.i + 3), 0, { wi: item.wi, qi: item.qi, retry: true });
      }
    } else {
      // learner says their own answer was right: undo the retry and the mistake
      const idx = sp.queue.findIndex((x, i) => i > sp.i && x.retry && x.wi === item.wi && x.qi === item.qi);
      if (idx > 0) sp.queue.splice(idx, 1);
      sp.wrong = sp.wrong.filter((x) => !(x.wi === item.wi && x.qi === item.qi));
      if (!item.retry && !item.peeked) sp.firstTry++;
    }

    document.getElementById("micArea").hidden = true;
    const others = pair.a.slice(1);
    let h;
    if (correct) {
      h = `<div class="feedback ok"><h3>${overridden ? "OK – counted as correct." : "Correct!"}</h3>
        ${said ? `<p><span class="label">You said:</span> “${esc(said)}”</p>` : ""}
        <p><span class="label">Book answer:</span> ${esc(pair.a[0])}</p>
        ${others.length ? `<p><span class="label">Also correct:</span> ${others.map(esc).join(" / ")}</p>` : ""}</div>`;
    } else {
      const tips = [];
      if (r.meaningFlip) tips.push("Your answer changes the meaning – check <b>yes / no</b> and <b>not</b> (e.g. <i>I don’t…</i>, <i>it isn’t…</i>).");
      const close = r.score >= 0.5; // only compare word by word when the answer is roughly similar
      const missing = [...new Set(r.ops.filter((o) => o.op === "miss" || o.op === "sub").map((o) => o.exp))];
      if (close && missing.length) tips.push(`Missing or wrong words: <b>${missing.slice(0, 6).map(esc).join(", ")}</b>${missing.length > 6 ? "…" : ""}.`);
      if (!close) tips.push("Your answer is very different from the book answer. Listen to it (🔊) and repeat it.");
      tips.push("Answer with a <b>full sentence</b> and repeat the words of the question: <i>Do you…? → Yes, I… / No, I don’t…</i>; <i>Is it…? → Yes, it is… / No, it isn’t…</i>");
      h = `<div class="feedback bad"><h3>Not quite.</h3>
        <p><span class="label">You said:</span> “${esc(said)}”</p>
        <p><span class="label">Correct answer:</span> <strong>${esc(pair.a[0])}</strong></p>
        ${others.length ? `<p><span class="label">Also correct:</span> ${others.map(esc).join(" / ")}</p>` : ""}
        ${close ? `<p class="label" style="margin-top:10px">Compare:</p>
        <p class="diff">${renderDiff(r.ops)}</p>
        <p class="legend"><span class="w miss">missing</span> <span class="w got">not needed / wrong</span></p>` : ""}
        ${tips.map((t) => `<p>${t}</p>`).join("")}
        <p class="label" style="margin-top:10px">Key words:</p>${keyWords(g)}
        <p class="lv">Šis jautājums tiks uzdots vēlreiz.</p></div>
        <button class="btn secondary" id="listenAns">🔊 Noklausīties pareizo atbildi</button>
        <button class="btn secondary" id="override">Mana atbilde bija pareiza (atpazīšanas kļūda)</button>`;
    }
    const last = sp.i + 1 >= sp.queue.length;
    const fb = document.getElementById("fb");
    fb.innerHTML = h + `<button class="btn" id="spNext">${last ? "Rezultāti" : "Tālāk"}</button>`;
    document.getElementById("spNext").addEventListener("click", () => { sp.i++; viewSpeakQ(); window.scrollTo(0, 0); });
    const la = document.getElementById("listenAns");
    if (la) la.addEventListener("click", () => speak(pair.a[0]));
    const ov = document.getElementById("override");
    if (ov) ov.addEventListener("click", () => { finishSpoken(item, true, r, said, true); });
    speak(pair.a[0]);
    if (!correct) fb.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function viewSpeakResults() {
    setHeader("Rezultāti", true);
    const pct = Math.round((sp.firstTry / sp.uniq) * 100);
    const list = sp.wrong.map((x) => { const g = WORDS[x.wi], p = g.qa[x.qi];
      return `<div class="mistake"><strong>${esc(g.word)}</strong><span style="display:block">Q: ${esc(p.q)}</span><span style="display:block">A: ${esc(p.a[0])}</span></div>`; }).join("");
    app.innerHTML = `
      <div class="card score"><p class="big">${sp.firstTry} / ${sp.uniq}</p><p>pareizi ar pirmo reizi · ${pct}%</p></div>
      ${list ? `<p class="section-label">Jāatkārto</p><div class="mistakes">${list}</div>` : ""}
      <button class="btn" id="spAgain">Vēl 10 jautājumi</button>
      <button class="btn secondary" data-go="#/speak">Uz sadaļu “Runāšana”</button>`;
    document.getElementById("spAgain").addEventListener("click", () => { sp = null; location.hash = "#/speak"; setTimeout(() => { const b = document.getElementById("spMixed"); if (b) b.click(); }, 0); });
  }

  /* ---------- routing & global events ---------- */
  function route() {
    const h = location.hash || "#/";
    let m;
    if (!h.startsWith("#/speakq")) stopRecog();
    if (h.startsWith("#/vocab")) viewVocab();
    else if ((m = h.match(/^#\/word\/(\d+)/))) viewWord(Number(m[1]));
    else if (h.startsWith("#/quiz")) viewQuiz();
    else if (h.startsWith("#/stats")) viewStats();
    else if (h.startsWith("#/speakq")) viewSpeakQ();
    else if (h.startsWith("#/speak")) viewSpeakHome();
    else viewHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  backBtn.addEventListener("click", () => {
    const h = location.hash;
    if (!h.startsWith("#/speakq")) stopRecog();
    if (h.startsWith("#/speakq")) {
      const finished = !sp || sp.i >= sp.queue.length;
      if (finished || confirm("Pārtraukt?")) { stopRecog(); sp = null; location.hash = "#/speak"; }
    } else if (h.startsWith("#/quiz")) {
      const finished = !session || session.i >= session.queue.length;
      if (finished || confirm("Pārtraukt?")) { const back = session && session.back; session = null; location.hash = back || "#/vocab"; }
    } else if (h.startsWith("#/word")) location.hash = "#/vocab";
    else location.hash = "#/";
  });
  app.addEventListener("click", (e) => {
    const sp = e.target.closest("[data-speak]"); if (sp) { e.stopPropagation(); speak(sp.dataset.speak); return; }
    const go = e.target.closest("[data-go]"); if (go) { if (location.hash.startsWith("#/quiz")) session = null; if (location.hash.startsWith("#/speakq")) { stopRecog(); sp = null; } location.hash = go.dataset.go; }
  });
  document.addEventListener("keydown", (e) => {
    if (!location.hash.startsWith("#/quiz") || !session) return;
    const nextBtn = document.getElementById("next");
    if ((e.key === "Enter" || e.key === " ") && nextBtn) { e.preventDefault(); nextBtn.click(); return; }
    const n = "1234".indexOf(e.key) >= 0 ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase());
    if (n >= 0) { const b = app.querySelector(`.opt[data-i="${n}"]`); if (b && !b.disabled) b.click(); }
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  route();
})();
