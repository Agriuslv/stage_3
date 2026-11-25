/* Compares a spoken (or typed) answer with the expected answer(s).
 * Tolerant to contractions (I'm = I am), punctuation, capital letters, number words (six = 6)
 * and small recognition errors. "..." in the expected answer is a place for the learner's
 * own words and matches anything. */
(function (root) {
  "use strict";

  const NUM = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
    eighty: 80, ninety: 90, hundred: 100, thousand: 1000
  };
  const SPECIAL = {
    "can't": ["can", "not"], "cannot": ["can", "not"], "won't": ["will", "not"], "shan't": ["shall", "not"],
    "let's": ["let", "us"], "okay": ["ok"], "o.k": ["ok"], "e-mail": ["email"], "e-mails": ["emails"],
    "per": ["per"], "gonna": ["going", "to"], "wanna": ["want", "to"]
  };
  // 's after these words means "is"; after other words it is usually possessive.
  const S_IS = new Set(["it", "that", "what", "he", "she", "there", "who", "where", "here", "how", "this", "when", "which", "why", "everything", "everyone", "everybody", "nothing", "someone", "somebody"]);
  const ENDINGS = { "n't": "not", "'re": "are", "'ll": "will", "'ve": "have", "'d": "would", "'m": "am" };

  function tokens(text) {
    let s = String(text || "").toLowerCase()
      .replace(/[’‘`´]/g, "'")
      .replace(/…|\.\.\.+/g, " * ")
      .replace(/(\d)[ ,](?=\d{3}\b)/g, "$1")       // 20 000 / 20,000 -> 20000
      .replace(/(\d)[.:](\d)/g, "$1 $2")             // 6.40 / 6:40 -> 6 40
      .replace(/\bper cent\b/g, "percent")
      .replace(/\ba\.m\.?/g, "am").replace(/\bp\.m\.?/g, "pm")
      .replace(/[–—-]/g, " ")
      .replace(/[^\p{L}\p{N}'*\s]/gu, " ");
    const out = [];
    s.split(/\s+/).forEach((t) => {
      t = t.replace(/^'+|'+$/g, "");
      if (!t) return;
      if (SPECIAL[t]) { out.push(...SPECIAL[t]); return; }
      for (const [end, full] of Object.entries(ENDINGS)) {
        if (t.endsWith(end) && t.length > end.length) {
          const base = t.slice(0, -end.length);
          out.push(end === "n't" && base === "ca" ? "can" : base, full);
          return;
        }
      }
      if (t.endsWith("'s")) {
        const base = t.slice(0, -2);
        out.push(base);
        if (S_IS.has(base)) out.push("is");
        return;
      }
      if (Object.prototype.hasOwnProperty.call(NUM, t)) { out.push(String(NUM[t])); return; }
      out.push(t.replace(/'/g, ""));
    });
    return out;
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(new Array(n).fill(0)));
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[m][n];
  }
  // Cost of saying word b where a was expected: 0 equal, small for near spelling (e.g. recognizer: "colour"/"color").
  function wordCost(a, b) {
    if (a === b) return 0;
    if (a.length >= 4 && b.length >= 4 && lev(a, b) <= 1) return 0.25;
    if (a.length >= 7 && b.length >= 7 && lev(a, b) <= 2) return 0.5;
    return 1;
  }

  // Word-level alignment (edit distance); "*" in the expected answer matches any number of words for free.
  function align(exp, got) {
    const m = exp.length, n = got.length, INF = 1e9;
    const D = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(INF));
    const P = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    D[0][0] = 0;
    for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
      if (i === 0 && j === 0) continue;
      const cands = [];
      if (i > 0 && exp[i - 1] === "*") {
        cands.push([D[i - 1][j], "skip*"]);            // wildcard matched nothing
        if (j > 0) cands.push([D[i][j - 1], "eat*"]);  // wildcard eats one more word
      } else {
        if (i > 0 && j > 0) { const c = wordCost(exp[i - 1], got[j - 1]); cands.push([D[i - 1][j - 1] + c, c === 0 ? "ok" : c < 1 ? "near" : "sub"]); }
        if (i > 0) cands.push([D[i - 1][j] + 1, "miss"]);
      }
      if (j > 0 && !(i > 0 && exp[i - 1] === "*")) cands.push([D[i][j - 1] + 1, "extra"]);
      for (const [v, op] of cands) if (v < D[i][j]) { D[i][j] = v; P[i][j] = op; }
    }
    // Backtrack into a list of operations.
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      const op = P[i][j];
      if (op === "ok" || op === "near" || op === "sub") { ops.push({ op, exp: exp[i - 1], got: got[j - 1] }); i--; j--; }
      else if (op === "miss") { ops.push({ op, exp: exp[i - 1] }); i--; }
      else if (op === "extra") { ops.push({ op, got: got[j - 1] }); j--; }
      else if (op === "skip*") { ops.push({ op: "wild", got: [] }); i--; }
      else if (op === "eat*") {
        // collect all words eaten by this wildcard
        const words = [];
        while (P[i][j] === "eat*") { words.unshift(got[j - 1]); j--; }
        ops.push({ op: "wild", got: words });
        i--; // the following skip* step is implied
      } else break;
    }
    ops.reverse();
    return { cost: D[m][n], ops };
  }

  /* expectedList: accepted answers; spokenList: recognizer alternatives (best first).
   * Returns the best match: { ok, score, expected, spoken, ops } */
  // How many word mistakes (mostly speech-recognition slips) are forgiven, by answer length.
  const allowed = (n) => (n >= 15 ? 2 : n >= 6 ? 1 : n >= 4 ? 0.5 : 0.25);

  function check(expectedList, spokenList) {
    let best = null;
    (expectedList || []).forEach((expected) => {
      const e = tokens(expected);
      const real = e.filter((t) => t !== "*").length || 1;
      (spokenList || []).forEach((spoken) => {
        const g = tokens(spoken);
        const { cost, ops } = align(e, g);
        const score = Math.max(0, 1 - cost / real);
        if (!best || score > best.score) best = { score, cost, real, expected, spoken, ops };
      });
    });
    if (!best) return { ok: false, score: 0, expected: (expectedList || [])[0] || "", spoken: "", ops: [] };
    // "yes" vs "no" or a missing "not" changes the meaning – never accept that.
    const meaningFlip = best.ops.some((o) => ["yes", "no", "not"].includes(o.exp) && o.op !== "ok" || ["yes", "no", "not"].includes(o.got) && o.op === "extra");
    best.ok = best.cost <= allowed(best.real) && !meaningFlip;
    best.meaningFlip = meaningFlip;
    return best;
  }

  const api = { tokens, check, align };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AnswerMatch = api;
})(typeof window !== "undefined" ? window : this);
