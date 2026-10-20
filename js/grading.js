// Pure scoring logic (no Firebase) — easy to test and tweak.

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩", FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function latinDigits(s) {
  return String(s ?? "").replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d)).replace(/[۰-۹]/g, d => FA_DIGITS.indexOf(d));
}
export function normalize(s) {
  return latinDigits(s).toLowerCase().normalize("NFKD")
    .replace(/[̀-ͯؐ-ًؚ-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/^(the|a|an|ال)\s+/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
export function toNumber(v) {
  const s = latinDigits(v).replace(/٫/g, ".").replace(/,(?=\d{1,2}$)/, ".").replace(/[^\d.\-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
export function parsePoints(str) {
  return String(str ?? "").split(/[,\s]+/).map(Number).filter(n => Number.isFinite(n));
}
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// true / false, or null when it can't be auto-checked (photos, tasks, line-ups).
export function isCorrect(q, value) {
  if (q.type === "text") {
    const n = normalize(value);
    if (!n) return false;
    const answers = String(q.answer ?? "").split("|").map(normalize).filter(Boolean);
    if (!answers.length) return null;
    return answers.some(a => a === n || (a.length >= 5 && lev(a, n) <= 1));
  }
  if (q.type === "choice") return q.answer === "" || q.answer == null ? null : Number(value) + 1 === Number(q.answer); // answer is 1-based
  if (q.type === "number") {
    const ans = toNumber(q.answer), v = toNumber(value);
    if (!Number.isFinite(ans)) return null;
    if (!Number.isFinite(v)) return false;
    return Math.abs(v - ans) <= (Number(q.tolerance) || 0);
  }
  return null;
}

const ordinal = n => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);

/**
 * q        question object
 * teamIds  array of team ids
 * assignQ  { teamId: { playerId: true, _all?: true } }
 * subsQ    { teamId: { team | playerId: { value, time, ... } } }
 * players  { teamId: { playerId: {...} } }
 * openedAt server time the answering started (for "took 12.3s")
 * Returns  { teamId: { auto, summary, answer, time, submitted, required, correctCount } }
 */
export function grade(q, teamIds, assignQ = {}, subsQ = {}, players = {}, openedAt = 0) {
  const pts = parsePoints(q.points);
  const p0 = pts[0] ?? 0;
  const wrongPen = Math.abs(Number(q.wrongPenalty) || 0);
  const ansNum = toNumber(q.answer);
  const label = v => q.type === "choice" ? `#${Number(v) + 1}` : String(v ?? "");
  const stats = {};

  for (const tid of teamIds) {
    const a = assignQ[tid] || {}, s = subsQ[tid] || {};
    const duty = a._all ? Object.keys(players[tid] || {}) : Object.keys(a).filter(k => k !== "_all");
    const entries = q.inputMode === "team"
      ? (s.team ? [s.team] : [])
      : Object.entries(s).filter(([k]) => k !== "team").map(([, v]) => v);
    const required = q.inputMode === "team" ? 1 : Math.max(duty.length, entries.length, 1);
    const ev = entries.map(e => ({
      e, correct: isCorrect(q, e.value),
      dist: q.type === "number" && Number.isFinite(ansNum) ? Math.abs(toNumber(e.value) - ansNum) : NaN
    }));
    const checkable = ev.length ? ev.some(x => x.correct !== null) : false;
    const correctCount = ev.filter(x => x.correct === true).length;
    const wrongCount = ev.filter(x => x.correct === false).length;
    const submitted = entries.length;
    const allIn = submitted > 0 && submitted >= required;
    const times = entries.map(e => e.time || 0);
    const time = q.inputMode === "team" ? (times[0] ?? null) : (allIn ? Math.max(...times) : null);
    const dists = ev.map(x => x.dist).filter(Number.isFinite);
    const dist = dists.length ? dists.reduce((x, y) => x + y, 0) / dists.length : NaN;
    stats[tid] = { submitted, required, allIn, time, dist, correctCount, wrongCount, checkable, ev };
  }

  const out = {};
  for (const tid of teamIds) {
    const st = stats[tid];
    let answer;
    if (q.inputMode === "team") answer = st.ev[0] ? label(st.ev[0].e.value) + (st.ev[0].e.name ? ` — ${st.ev[0].e.name}` : "") : "—";
    else answer = `${st.submitted}/${st.required} answered` + (st.checkable ? `, ${st.correctCount} correct` : "");
    out[tid] = {
      auto: 0, answer, time: st.time, submitted: st.submitted, required: st.required, correctCount: st.correctCount,
      summary: q.inputMode === "team" ? (st.ev[0] ? (st.ev[0].correct === true ? "✓ " : st.ev[0].correct === false ? "✗ " : "") + label(st.ev[0].e.value) : "no answer") : answer
    };
  }

  const took = tm => tm && openedAt ? ` · ${((tm - openedAt) / 1000).toFixed(1)}s` : "";
  const mode = q.scoring || "speed";

  if (mode === "speed") {
    const elig = teamIds.filter(tid => {
      const st = stats[tid];
      if (q.inputMode === "team") return st.submitted > 0 && st.ev[0].correct !== false;
      return st.allIn && (!st.checkable || st.correctCount > 0);
    }).sort((a, b) => stats[a].time - stats[b].time);
    elig.forEach((tid, i) => {
      const st = stats[tid];
      let p = pts[i] ?? 0;
      if (q.inputMode === "each" && st.checkable) p = Math.round(p * st.correctCount / st.required);
      out[tid].auto = p;
      out[tid].summary += ` · ${ordinal(i + 1)}${took(st.time)}`;
    });
  } else if (mode === "closest") {
    const elig = teamIds.filter(tid => Number.isFinite(stats[tid].dist))
      .sort((a, b) => stats[a].dist - stats[b].dist || (stats[a].time || 0) - (stats[b].time || 0));
    let rank = 0;
    elig.forEach((tid, i) => {
      if (i > 0 && stats[tid].dist !== stats[elig[i - 1]].dist) rank = i;
      out[tid].auto = pts[rank] ?? 0;
      out[tid].summary += ` · off by ${+stats[tid].dist.toFixed(2)} · ${ordinal(rank + 1)}`;
    });
  } else if (mode === "correct") {
    for (const tid of teamIds) {
      const st = stats[tid];
      if (!st.submitted) continue;
      if (q.inputMode === "team") out[tid].auto = st.ev[0].correct === false ? 0 : p0;
      else out[tid].auto = Math.round(p0 * (st.checkable ? st.correctCount : st.submitted) / st.required);
    }
  } else if (mode === "participation") {
    for (const tid of teamIds) out[tid].auto = Math.round(p0 * stats[tid].submitted / stats[tid].required);
  }
  // manual → stays 0 for the host to fill in

  if (wrongPen) for (const tid of teamIds) {
    if (stats[tid].wrongCount) {
      out[tid].auto -= wrongPen * (q.inputMode === "team" ? 1 : stats[tid].wrongCount);
      out[tid].summary += ` · −${wrongPen * (q.inputMode === "team" ? 1 : stats[tid].wrongCount)} wrong`;
    }
  }
  if (q.practice) for (const tid of teamIds) out[tid].auto = 0;
  return out;
}

// Decide which players are "on duty" for a question, per team.
// players: { pid: {number, online} }, played: { pid: count }
export function pickPlayers(q, players = {}, played = {}, rand = Math.random) {
  const ids = Object.keys(players);
  if (!ids.length) return [];
  const target = q.target || "all";
  if (target === "all") return ids;
  if (target === "numbers") {
    const sorted = ids.sort((a, b) => players[a].number - players[b].number);
    const wanted = String(q.numbers || "").split(/[,\s]+/).map(Number).filter(n => n > 0);
    const out = new Set();
    for (const n of wanted) {
      const exact = sorted.find(id => players[id].number === n);
      out.add(exact || sorted[(n - 1) % sorted.length]); // wrap if this team is smaller
    }
    return [...out];
  }
  // rotate: fewest turns first, online first, random tie-break
  const n = Math.max(1, Number(q.groupSize) || 1);
  const shuffled = ids.map(id => [id, rand()]);
  shuffled.sort((a, b) =>
    (players[b[0]].online ? 1 : 0) - (players[a[0]].online ? 1 : 0) ||
    (played[a[0]] || 0) - (played[b[0]] || 0) || a[1] - b[1]);
  return shuffled.slice(0, n).map(x => x[0]);
}
