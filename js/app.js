/* Stage 3 English – mācību platforma (vārdu apguve) */
(function () {
  "use strict";

  const DATA = window.VOCABULARY || { words: [] };
  const WORDS = (DATA.words || []).filter((w) => w && w.word);
  const STORE_KEY = "stage3.vocab.v2";
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

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const DIRS = { qa: "Jautājums → atbilde", aq: "Atbilde → jautājums" };
  const itemKey = (wi, qi, dir) => `${WORDS[wi].word}|${qi}|${dir}`;

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
    WORDS.forEach((w, wi) => (w.qa || []).forEach((p, qi) => out.push({ wi, qi, q: p.q, a: p.a })));
    return out;
  }

  // One question: in "qa" the prompt is the question and the options are answers; "aq" is the reverse.
  function makeQuestion(wi, qi, dir) {
    const pair = WORDS[wi].qa[qi];
    const field = dir === "qa" ? "a" : "q";
    const correctText = pair[field];
    const pool = allPairs().filter((p) => !(p.wi === wi && p.qi === qi) && p[field] !== correctText);
    // Prefer options from other words, so that the only valid option is the real one.
    const other = shuffle(pool.filter((p) => p.wi !== wi));
    const same = shuffle(pool.filter((p) => p.wi === wi));
    const seen = new Set([correctText]);
    const distractors = [];
    other.concat(same).forEach((p) => { if (distractors.length < 3 && !seen.has(p[field])) { seen.add(p[field]); distractors.push(p); } });
    const options = shuffle([{ wi, qi, text: correctText }].concat(distractors.map((p) => ({ wi: p.wi, qi: p.qi, text: p[field] }))));
    return { wi, qi, dir, key: itemKey(wi, qi, dir), prompt: dir === "qa" ? pair.q : pair.a, answer: correctText, options };
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
      <input class="search" id="search" type="search" placeholder="Meklēt vārdu…" value="${esc(searchText)}" autocomplete="off" autocapitalize="off">
      <div class="word-list" id="list"></div>
      <button class="btn secondary" id="reset" style="background:none;color:var(--muted);font-weight:500">Dzēst progresu</button>`;

    const renderList = () => {
      const q = searchText.trim().toLowerCase();
      const rows = WORDS.map((w, wi) => ({ w, wi })).filter(({ w }) => !q || w.word.toLowerCase().includes(q));
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
        const prio = !s ? 1 : s.last === false ? 2 : 0;
        return { p, prio: prio + Math.random() };
      }).sort((a, b) => b.prio - a.prio).slice(0, 10);
      startSession(shuffle(items).map(({ p }) => makeQuestion(p.wi, p.qi, dir)), { title: "Jaukti jautājumi", back: "#/vocab" });
    });
    document.getElementById("reset").addEventListener("click", () => {
      if (confirm("Vai tiešām dzēst visu vārdu apguves progresu?")) { stats = {}; save(STORE_KEY, stats); viewVocab(); }
    });
  }

  function viewWord(wi) {
    const w = WORDS[wi];
    if (!w) { location.replace("#/vocab"); return; }
    setHeader("Vārdiņi", true);
    const dir = settings.dir;
    const p = wordProgress(wi, dir);
    const n = (w.qa || []).length;
    app.innerHTML = `
      <div class="card word-card">
        <p class="qtype">Word ${wi + 1} of ${WORDS.length}</p>
        <p class="prompt prompt-word">${esc(w.word)}${speakBtn(w.word)}</p>
        ${w.pos ? `<span class="pos">${esc(w.pos)}</span>` : ""}
        <p class="explanation">${esc(w.explanation || "")}</p>
        ${w.example ? `<p class="ex">“${esc(w.example)}”</p>` : ""}
        ${w.translation ? `<p class="lv">LV: ${esc(w.translation)}</p>` : ""}
      </div>
      <p class="hint">${n} ${n === 1 ? "jautājums" : "jautājumi"} · ${DIRS[dir]} · apgūts ${p.pct}%</p>
      <button class="btn" id="know" ${n ? "" : "disabled"}>I know this word</button>
      <div class="pager">
        <button class="btn secondary" data-go="#/word/${(wi - 1 + WORDS.length) % WORDS.length}">← Iepriekšējais</button>
        <button class="btn secondary" data-go="#/word/${(wi + 1) % WORDS.length}">Nākamais →</button>
      </div>`;
    document.getElementById("know").addEventListener("click", () => {
      const qs = shuffle((w.qa || []).map((_, qi) => makeQuestion(wi, qi, dir)));
      startSession(qs, { title: w.word, back: `#/word/${wi}`, wi });
    });
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
        <p class="qtype">${label} · <span class="tag-word">${esc(WORDS[q.wi].word)}</span></p>
        <p class="prompt">${esc(q.prompt)}</p>
      </div>
      <div class="options">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${LETTERS[i]}</span><span>${esc(o.text)}</span></button>`).join("")}</div>
      <div id="fb"></div>`;
    app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.i))));
  }

  function explain(q, chosen, correct) {
    const w = WORDS[q.wi];
    if (correct) {
      return `<h3>Correct!</h3><p><strong>${esc(w.word)}</strong>${w.pos ? ` <span class="pos">(${esc(w.pos)})</span>` : ""} – ${esc(w.explanation || "")}.</p>`;
    }
    const pair = w.qa[q.qi];
    let h = `<h3>Not quite.</h3>`;
    if (q.dir === "qa") h += `<p><span class="label">Question:</span> ${esc(pair.q)}</p><p><span class="label">Correct answer:</span> <strong>${esc(pair.a)}</strong></p>`;
    else h += `<p><span class="label">Answer:</span> ${esc(pair.a)}</p><p><span class="label">Correct question:</span> <strong>${esc(pair.q)}</strong></p>`;
    h += `<p><span class="label">Key word:</span> <strong>${esc(w.word)}</strong>${w.pos ? ` <span class="pos">(${esc(w.pos)})</span>` : ""} – ${esc(w.explanation || "")}.</p>`;
    if (w.example) h += `<p class="ex">“${esc(w.example)}”</p>`;

    const cw = WORDS[chosen.wi];
    const cp = cw && cw.qa[chosen.qi];
    if (cp) {
      h += `<hr>`;
      if (q.dir === "qa") h += `<p><span class="label">Why your choice is wrong:</span> “${esc(chosen.text)}” is the answer to a different question: <em>“${esc(cp.q)}”</em> (word: <strong>${esc(cw.word)}</strong>).</p>`;
      else h += `<p><span class="label">Why your choice is wrong:</span> the question “${esc(chosen.text)}” has a different answer: <em>“${esc(cp.a)}”</em> (word: <strong>${esc(cw.word)}</strong>).</p>`;
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
      return `<div class="mistake"><strong>${esc(w.word)}</strong><span style="display:block">Q: ${esc(p.q)}</span><span style="display:block">A: ${esc(p.a)}</span></div>`;
    }).join("");
    const hasNext = session.wi != null;
    app.innerHTML = `
      <div class="card score"><p class="big">${session.firstTry} / ${total}</p><p>pareizi ar pirmo reizi · ${pct}%</p><p>${msg}</p></div>
      ${list ? `<p class="section-label">Kļūdas – tās tika atkārtotas un paliek sadaļā “Atkārtot kļūdas”, līdz atbildēsi pareizi</p><div class="mistakes">${list}</div>` : ""}
      ${hasNext ? `<button class="btn" data-go="#/word/${(session.wi + 1) % WORDS.length}">Nākamais vārds →</button>` : ""}
      <button class="btn ${hasNext ? "secondary" : ""}" data-go="#/vocab">Uz vārdu sarakstu</button>`;
  }

  /* ---------- routing & global events ---------- */
  function route() {
    const h = location.hash || "#/";
    let m;
    if (h.startsWith("#/vocab")) viewVocab();
    else if ((m = h.match(/^#\/word\/(\d+)/))) viewWord(Number(m[1]));
    else if (h.startsWith("#/quiz")) viewQuiz();
    else viewHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  backBtn.addEventListener("click", () => {
    const h = location.hash;
    if (h.startsWith("#/quiz")) {
      const finished = !session || session.i >= session.queue.length;
      if (finished || confirm("Pārtraukt?")) { const back = session && session.back; session = null; location.hash = back || "#/vocab"; }
    } else if (h.startsWith("#/word")) location.hash = "#/vocab";
    else location.hash = "#/";
  });
  app.addEventListener("click", (e) => {
    const sp = e.target.closest("[data-speak]"); if (sp) { e.stopPropagation(); speak(sp.dataset.speak); return; }
    const go = e.target.closest("[data-go]"); if (go) { if (location.hash.startsWith("#/quiz")) session = null; location.hash = go.dataset.go; }
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
