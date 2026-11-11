/* Stage 3 English – mācību platforma (vārdu apguve) */
(function () {
  "use strict";

  const DATA = window.VOCABULARY || { units: [] };
  const STORE_KEY = "stage3.vocab.v1";
  const SETTINGS_KEY = "stage3.settings.v1";
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
  let stats = load(STORE_KEY, {});
  let settings = Object.assign({ units: [], count: 10, mode: "mixed" }, load(SETTINGS_KEY, {}));

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wordKey = (unitId, w) => unitId + "|" + w.word;
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const LETTERS = ["A", "B", "C", "D", "E", "F"];

  const ICONS = {
    words: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6.5A2.5 2.5 0 0 0 4 20.5 2.5 2.5 0 0 0 6.5 23H19v-5"/><path d="M8 7h7M8 11h5"/></svg>',
    dictation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
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
      const voice = window.speechSynthesis.getVoices().find((v) => /^en(-|_)GB/i.test(v.lang)) ||
                    window.speechSynthesis.getVoices().find((v) => /^en/i.test(v.lang));
      if (voice) u.voice = voice;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  const speakBtn = (text) => `<button class="speak" data-speak="${esc(text)}" aria-label="Izrunāt">${ICONS.speak}</button>`;

  /* ---------- question generation ---------- */
  function allWords(unitIds) {
    const out = [];
    DATA.units.forEach((u) => {
      if (unitIds && !unitIds.includes(u.id)) return;
      (u.words || []).forEach((w) => out.push(Object.assign({ unitId: u.id }, w)));
    });
    return out;
  }

  // Finds the word inside its example sentence (exact form) to build a gap-fill.
  function gapSentence(w) {
    if (!w.example) return null;
    const re = new RegExp("(^|[^A-Za-z'])(" + escRe(w.word) + ")(?![A-Za-z])", "i");
    const m = w.example.match(re);
    if (!m) return null;
    const start = m.index + m[1].length;
    return { before: w.example.slice(0, start), after: w.example.slice(start + m[2].length) };
  }

  function pickDistractors(target, pool, n) {
    const others = pool.filter((w) => w.word.toLowerCase() !== target.word.toLowerCase());
    const samePos = shuffle(others.filter((w) => w.pos && w.pos === target.pos));
    const rest = shuffle(others.filter((w) => !(w.pos && w.pos === target.pos)));
    return samePos.concat(rest).slice(0, n);
  }

  function makeQuestion(w, mode, pool) {
    let types = ["def2word", "word2def"];
    const gap = gapSentence(w);
    if (gap) types.push("gap");
    if (mode !== "mixed") types = types.includes(mode) ? [mode] : types;
    const type = types[Math.floor(Math.random() * types.length)];

    const distractors = pickDistractors(w, pool, 3);
    const optionWords = shuffle([w].concat(distractors));
    const q = { kind: "word", type, word: w, key: wordKey(w.unitId, w), optionWords };

    if (type === "word2def") {
      q.options = optionWords.map((o) => o.meaning);
      q.answer = w.meaning;
    } else {
      q.options = optionWords.map((o) => o.word);
      q.answer = w.word;
    }
    if (type === "gap") q.gap = gap;
    return q;
  }

  function makeCustomQuestion(cq, unitId, idx) {
    return {
      kind: "custom", type: "custom", key: unitId + "|q" + idx, custom: cq,
      options: shuffle(cq.options), answer: cq.answer
    };
  }

  // Weight: words answered wrongly more often (or never seen) come first.
  function priority(key) {
    const s = stats[key];
    if (!s) return 1 + Math.random();
    return (s.w - s.c * 0.5) + Math.random() * 1.5;
  }

  function buildSession(unitIds, count, mode, onlyKeys) {
    const pool = allWords(unitIds);
    const fullPool = allWords();
    const distractorPool = pool.length >= 4 ? pool : fullPool;
    let items = pool.map((w) => ({ key: wordKey(w.unitId, w), make: () => makeQuestion(w, mode, distractorPool) }));
    if (mode === "mixed" || mode === "custom") {
      DATA.units.forEach((u) => {
        if (!unitIds.includes(u.id)) return;
        (u.questions || []).forEach((cq, i) => items.push({ key: u.id + "|q" + i, make: () => makeCustomQuestion(cq, u.id, i) }));
      });
    }
    if (onlyKeys) items = items.filter((it) => onlyKeys.includes(it.key));
    items.sort((a, b) => priority(b.key) - priority(a.key));
    if (count && count > 0) items = items.slice(0, count);
    return shuffle(items).map((it) => it.make());
  }

  /* ---------- explanation (English) ---------- */
  function wordBlock(w, heading) {
    let h = `<p><span class="label">${esc(heading)}</span> <strong>${esc(w.word)}</strong>`;
    if (w.pos) h += ` <span class="pos">(${esc(w.pos)})</span>`;
    h += ` – ${esc(w.meaning)}.</p>`;
    return h;
  }

  function explain(q, chosen, correct) {
    if (q.kind === "custom") {
      let h = correct ? `<h3>Correct!</h3>` : `<h3>Not quite.</h3><p>The correct answer is <strong>${esc(q.answer)}</strong>.</p>`;
      if (q.custom.explanation) h += `<p>${esc(q.custom.explanation)}</p>`;
      return h;
    }
    const w = q.word;
    let h = "";
    if (correct) {
      h += `<h3>Correct!</h3>`;
      h += wordBlock(w, "");
      if (w.example) h += `<p class="ex">“${esc(w.example)}”</p>`;
      return h;
    }
    h += `<h3>Not quite.</h3>`;
    h += `<p>The correct answer is <strong>${esc(q.answer)}</strong>.</p>`;
    h += wordBlock(w, "Meaning:");
    if (w.example) h += `<p><span class="label">Example:</span> <span class="ex">“${esc(w.example)}”</span></p>`;
    if (w.usage) h += `<p><span class="label">Usage:</span> ${esc(w.usage)}</p>`;

    const idx = q.options.indexOf(chosen);
    const chosenWord = idx >= 0 ? q.optionWords[idx] : null;
    if (chosenWord && chosenWord.word !== w.word) {
      h += `<hr><p><span class="label">Your answer:</span> <strong>${esc(chosenWord.word)}</strong>`;
      if (chosenWord.pos) h += ` <span class="pos">(${esc(chosenWord.pos)})</span>`;
      h += ` means “${esc(chosenWord.meaning)}”.`;
      if (q.type === "gap") h += ` It does not fit this sentence.`;
      h += `</p>`;
      if (chosenWord.example) h += `<p class="ex">“${esc(chosenWord.example)}”</p>`;
    }
    if (w.translation) h += `<p class="lv">LV: ${esc(w.word)} — ${esc(w.translation)}</p>`;
    return h;
  }

  /* ---------- views ---------- */
  let session = null;

  function setHeader(title, showBack) {
    titleEl.textContent = title;
    backBtn.hidden = !showBack;
  }

  function viewHome() {
    setHeader("Stage 3 English", false);
    const total = allWords().length;
    app.innerHTML = `
      <p class="lead">Izvēlies sadaļu. Skaidrojumi pie kļūdām tiek sniegti angļu valodā.</p>
      <div class="tiles">
        <button class="tile" data-go="#/vocab">
          <span class="ico">${ICONS.words}</span>
          <span><strong>Vārdiņi</strong><span class="sub">Vocabulary · ${total} vārdi</span></span>
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

  function unitMastery(u) {
    const words = u.words || [];
    if (!words.length) return 0;
    const learned = words.filter((w) => { const s = stats[wordKey(u.id, w)]; return s && s.c > s.w && s.streak >= 2; }).length;
    return Math.round((learned / words.length) * 100);
  }

  function mistakeKeys(unitIds) {
    return Object.keys(stats).filter((k) => unitIds.includes(k.split("|")[0]) && stats[k].lastWrong);
  }

  function viewVocab() {
    setHeader("Vārdiņi", true);
    if (!DATA.units.length) { app.innerHTML = `<p class="empty">Vārdu saraksts vēl nav pievienots.</p>`; return; }
    const valid = settings.units.filter((id) => DATA.units.some((u) => u.id === id));
    settings.units = valid.length ? valid : DATA.units.map((u) => u.id);

    const units = DATA.units.map((u) => {
      const m = unitMastery(u);
      const checked = settings.units.includes(u.id) ? "checked" : "";
      return `<label class="unit">
          <input type="checkbox" value="${esc(u.id)}" ${checked}>
          <span style="flex:1;min-width:0">
            <strong>${esc(u.title)}</strong>
            <span class="meta" style="display:block">${(u.words || []).length} vārdi · apgūti ${m}%</span>
            <span class="bar"><i style="width:${m}%"></i></span>
          </span>
        </label>`;
    }).join("");

    const counts = [[10, "10"], [20, "20"], [0, "Visi"]];
    const modes = [["mixed", "Jaukti"], ["def2word", "Nozīme → vārds"], ["word2def", "Vārds → nozīme"], ["gap", "Teikums"]];
    const seg = (name, list, cur) => `<div class="seg" data-seg="${name}">${list.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join("")}</div>`;

    app.innerHTML = `
      <p class="section-label">Tēmas</p>
      <div class="unit-list">${units}</div>
      <p class="section-label">Jautājumu skaits</p>
      ${seg("count", counts, settings.count)}
      <p class="section-label">Jautājumu veids</p>
      ${seg("mode", modes, settings.mode)}
      <button class="btn" id="start">Sākt</button>
      <button class="btn secondary" id="review">Atkārtot kļūdas</button>
      <button class="btn secondary" id="reset" style="background:none;color:var(--muted);font-weight:500">Dzēst progresu</button>`;

    const refresh = () => {
      const n = mistakeKeys(settings.units).length;
      const r = document.getElementById("review");
      r.textContent = `Atkārtot kļūdas (${n})`;
      r.disabled = n === 0;
      document.getElementById("start").disabled = settings.units.length === 0;
    };
    app.querySelectorAll(".unit input").forEach((cb) => cb.addEventListener("change", () => {
      settings.units = [...app.querySelectorAll(".unit input:checked")].map((x) => x.value);
      save(SETTINGS_KEY, settings); refresh();
    }));
    app.querySelectorAll(".seg").forEach((s) => s.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const name = s.dataset.seg;
      settings[name] = name === "count" ? Number(b.dataset.v) : b.dataset.v;
      s.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      save(SETTINGS_KEY, settings);
    }));
    document.getElementById("start").addEventListener("click", () => startSession(buildSession(settings.units, settings.count, settings.mode)));
    document.getElementById("review").addEventListener("click", () => startSession(buildSession(settings.units, 0, "mixed", mistakeKeys(settings.units))));
    document.getElementById("reset").addEventListener("click", () => {
      if (confirm("Vai tiešām dzēst visu vārdu apguves progresu?")) { stats = {}; save(STORE_KEY, stats); viewVocab(); }
    });
    refresh();
  }

  function startSession(questions) {
    if (!questions.length) { alert("Nav jautājumu izvēlētajām tēmām."); return; }
    session = { questions, i: 0, correct: 0, wrong: [] };
    location.hash = "#/quiz";
  }

  function viewQuiz() {
    if (!session) { location.replace("#/vocab"); return; }
    const total = session.questions.length;
    if (session.i >= total) { viewResults(); return; }
    setHeader("Vārdiņi", true);
    const q = session.questions[session.i];
    let head = "";

    if (q.kind === "custom") {
      head = `<p class="qtype">Choose the correct answer</p><p class="prompt">${esc(q.custom.question)}</p>`;
    } else if (q.type === "def2word") {
      head = `<p class="qtype">Which word means…</p><p class="prompt">${esc(q.word.meaning)}</p>${q.word.pos ? `<span class="pos">${esc(q.word.pos)}</span>` : ""}`;
    } else if (q.type === "word2def") {
      head = `<p class="qtype">What does this mean?</p><p class="prompt prompt-word">${esc(q.word.word)}${speakBtn(q.word.word)}</p>${q.word.pos ? `<span class="pos">${esc(q.word.pos)}</span>` : ""}`;
    } else {
      head = `<p class="qtype">Complete the sentence</p><p class="prompt">${esc(q.gap.before)}<span class="gap">&nbsp;</span>${esc(q.gap.after)}</p>`;
    }

    const opts = q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${LETTERS[i]}</span><span>${esc(o)}</span></button>`).join("");
    const pct = Math.round((session.i / total) * 100);

    app.innerHTML = `
      <div class="progress"><span>${session.i + 1} / ${total}</span><span class="bar"><i style="width:${pct}%"></i></span><span>✓ ${session.correct}</span></div>
      <div class="card">${head}</div>
      <div class="options">${opts}</div>
      <div id="fb"></div>`;

    app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.i))));
  }

  function answer(idx) {
    const q = session.questions[session.i];
    if (q.answered) return;
    q.answered = true;
    const chosen = q.options[idx];
    const correct = chosen === q.answer;

    const s = stats[q.key] || { c: 0, w: 0, streak: 0 };
    if (correct) { s.c++; s.streak = (s.streak || 0) + 1; if (s.streak >= 2) s.lastWrong = false; }
    else { s.w++; s.streak = 0; s.lastWrong = true; }
    s.t = Date.now();
    stats[q.key] = s; save(STORE_KEY, stats);

    if (correct) session.correct++; else session.wrong.push({ q, chosen });

    app.querySelectorAll(".opt").forEach((b, i) => {
      b.disabled = true;
      if (q.options[i] === q.answer) b.classList.add("correct");
      else if (i === idx) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    const last = session.i + 1 >= session.questions.length;
    const fb = document.getElementById("fb");
    fb.innerHTML = `<div class="feedback ${correct ? "ok" : "bad"}">${explain(q, chosen, correct)}</div>
      <button class="btn" id="next">${last ? "Rezultāti" : "Tālāk"}</button>`;
    document.getElementById("next").addEventListener("click", next);
    if (q.kind === "word") speak(q.word.word);
    if (!correct) fb.scrollIntoView({ behavior: "smooth", block: "start" });
    else document.getElementById("next").focus({ preventScroll: true });
  }

  function next() { session.i++; viewQuiz(); window.scrollTo(0, 0); }

  function viewResults() {
    setHeader("Rezultāti", true);
    const total = session.questions.length;
    const pct = Math.round((session.correct / total) * 100);
    const msg = pct === 100 ? "Excellent! Viss pareizi." : pct >= 80 ? "Great job!" : pct >= 50 ? "Good effort – keep practising." : "Keep going – practice makes perfect.";
    const list = session.wrong.map(({ q, chosen }) => {
      if (q.kind === "custom") return `<div class="mistake"><strong>${esc(q.custom.question)}</strong><span>Correct: ${esc(q.answer)} · Your answer: ${esc(chosen)}</span></div>`;
      return `<div class="mistake"><strong>${esc(q.word.word)}${q.word.pos ? ` <span class="pos">(${esc(q.word.pos)})</span>` : ""}</strong><span>${esc(q.word.meaning)}</span>${q.word.translation ? `<span class="lv" style="display:block">LV: ${esc(q.word.translation)}</span>` : ""}</div>`;
    }).join("");

    app.innerHTML = `
      <div class="card score"><p class="big">${session.correct} / ${total}</p><p>${pct}% · ${msg}</p></div>
      ${session.wrong.length ? `<p class="section-label">Vārdi, kas jāatkārto</p><div class="mistakes">${list}</div>` : ""}
      ${session.wrong.length ? `<button class="btn" id="retry">Atkārtot kļūdas</button>` : ""}
      <button class="btn ${session.wrong.length ? "secondary" : ""}" id="again">Jauns tests</button>
      <button class="btn secondary" id="home">Uz sākumu</button>`;

    const retry = document.getElementById("retry");
    if (retry) retry.addEventListener("click", () => {
      const keys = session.wrong.map((x) => x.q.key);
      startSession(buildSession(settings.units, 0, "mixed", keys));
      viewQuiz();
    });
    document.getElementById("again").addEventListener("click", () => { startSession(buildSession(settings.units, settings.count, settings.mode)); viewQuiz(); });
    document.getElementById("home").addEventListener("click", () => { session = null; location.hash = "#/"; });
  }

  /* ---------- routing & global events ---------- */
  function route() {
    const h = location.hash || "#/";
    if (h.startsWith("#/vocab")) viewVocab();
    else if (h.startsWith("#/quiz")) viewQuiz();
    else viewHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  backBtn.addEventListener("click", () => {
    const h = location.hash;
    if (h.startsWith("#/quiz")) { if (!session || session.i >= session.questions.length || confirm("Pārtraukt testu?")) { session = null; location.hash = "#/vocab"; } }
    else location.hash = "#/";
  });
  app.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]"); if (go) { location.hash = go.dataset.go; return; }
    const sp = e.target.closest("[data-speak]"); if (sp) { e.stopPropagation(); speak(sp.dataset.speak); }
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
