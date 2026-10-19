// Host / moderator panel
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword as secSignIn, signOut as secSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  auth, db, ref, onValue, get, update, push, remove, set, serverTimestamp,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, serverNow, firebaseConfig,
  $, $$, esc, applyBranding, configBanner, toast, totals, TYPE_ICON, qOptions, compressImage, GAME, authProblem, checkAdmin
} from "./common.js";
import { grade, pickPlayers } from "./grading.js";
import { SAMPLE_QUESTIONS } from "./samples.js";

applyBranding();
if (configBanner()) throw new Error("Firebase not configured");

let questions = {}, teams = {}, players = {}, played = {}, game = {}, ledger = {}, applied = {};
let assignQ = {}, subsQ = {}, imagesQ = {};
let selQid = null, editQid = null, gradeResult = null, gradeQid = null;
let qUnsubs = [], lastQid, lockSentFor = null;
const COLORS = ["#ff5a5f", "#2ec4b6", "#ffbe0b", "#3a86ff", "#8338ec", "#fb5607", "#06d6a0", "#ef476f"];

// ---------------- auth ----------------
$("#hLoginForm").onsubmit = async e => {
  e.preventDefault(); $("#hLoginErr").textContent = "";
  try { await signInWithEmailAndPassword(auth, $("#hEmail").value.trim(), $("#hPass").value); }
  catch (err) {
    console.error(err);
    $("#hLoginErr").textContent = authProblem(err) ||
      "Wrong email or password. Check this exact email is listed in Firebase → Authentication → Users (you can reset the password there).";
  }
};
$("#hostLogout").onclick = () => signOut(auth).then(() => location.reload());
$("#resetOpen").onclick = () => $("#resetModal").classList.remove("hidden");
$("#resetCancel").onclick = () => $("#resetModal").classList.add("hidden");
$("#resetModal").addEventListener("click", e => { if (e.target.id === "resetModal") e.currentTarget.classList.add("hidden"); });
$$("#resetModal [data-reset]").forEach(b => b.onclick = async () => {
  const all = b.dataset.reset === "all";
  if (!confirm(all ? "Remove ALL players and clear every score? This can't be undone." : "Clear every score, grade and answer? This can't be undone.")) return;
  $("#resetModal").classList.add("hidden");
  await reset(all);
});

onAuthStateChanged(auth, async user => {
  if (!user) return showPane("hLogin");
  let isAdmin = false;
  try { isAdmin = await checkAdmin(user.uid); }
  catch (e) { $("#hLoginErr").textContent = e.message; $("#hostLogout").classList.remove("hidden"); return showPane("hLogin"); }
  if (!isAdmin) {
    $("#hLoginErr").innerHTML = `Signed in ✓ — but this account isn't a host yet.<br>In Firebase → <b>Realtime Database → Data</b>, add <code>admins</code> → <code>${esc(user.uid)}</code> → <code>true</code>, then reload this page.<br><small>Your UID: <b>${esc(user.uid)}</b></small>`;
    $("#hostLogout").classList.remove("hidden");
    return showPane("hLogin");
  }
  $("#tabs").classList.remove("hidden"); $("#hostLogout").classList.remove("hidden"); $("#resetOpen").classList.remove("hidden");
  showTab("live");
  listen();
});

function showPane(id) { $$(".host-pane").forEach(p => p.classList.toggle("hidden", p.id !== id)); }
function showTab(name) {
  showPane("tab-" + name);
  $$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
}
$$("#tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));

function listen() {
  onValue(ref(db, "questions"), s => { questions = s.val() || {}; renderRunList(); renderQList(); renderPreview(); });
  onValue(ref(db, "teams"), s => { teams = s.val() || {}; renderAll(); });
  onValue(ref(db, "players"), s => { players = s.val() || {}; renderTeams(); renderLiveSubs(); });
  onValue(ref(db, "played"), s => { played = s.val() || {}; renderTeams(); });
  onValue(ref(db, "ledger"), s => { ledger = s.val() || {}; renderAdjust(); renderScores(); });
  onValue(ref(db, "applied"), s => { applied = s.val() || {}; renderRunList(); });
  onValue(ref(db, "game"), s => { game = s.val() || { phase: "lobby" }; onGame(); });
  onValue(ref(db, "settings"), s => renderLook(s.val() || {}));
  setInterval(tick, 250);
}
function renderAll() { renderAdjust(); renderTeams(); renderScores(); renderLiveSubs(); }

function onGame() {
  if (game.qid !== lastQid) {
    lastQid = game.qid;
    qUnsubs.forEach(u => u()); qUnsubs = [];
    assignQ = {}; subsQ = {}; imagesQ = {};
    if (game.qid) {
      qUnsubs.push(onValue(ref(db, `assign/${game.qid}`), s => { assignQ = s.val() || {}; renderLiveSubs(); }));
      qUnsubs.push(onValue(ref(db, `submissions/${game.qid}`), s => { subsQ = s.val() || {}; renderLiveSubs(); }));
      qUnsubs.push(onValue(ref(db, `images/${game.qid}`), s => { imagesQ = s.val() || {}; renderLiveSubs(); }));
    }
  }
  $("#phaseBadge").textContent = game.phase || "lobby";
  $("#phaseBadge").className = "phase-badge ph-" + (game.phase || "lobby");
  $("#bBoard").textContent = game.showBoard ? "🙈 Hide scoreboard" : "🏆 Show scoreboard";
  $("#bBoard").classList.toggle("on", !!game.showBoard);
  $("#bGallery").classList.toggle("on", !!game.gallery);
  renderRunList(); updateControls();
}

const sortedQ = () => Object.entries(questions).sort((a, b) => (a[1].order || 0) - (b[1].order || 0) || (a[0] < b[0] ? -1 : 1));
const qIndex = qid => sortedQ().findIndex(([id]) => id === qid) + 1;
const teamIds = () => Object.keys(teams).sort((a, b) => (teams[a].name || "").localeCompare(teams[b].name || ""));

// ---------------- LIVE: run order + preview ----------------
function targetLabel(q) {
  if (q.target === "rotate") return `rotate ${q.groupSize || 1}/team`;
  if (q.target === "numbers") return `player #${q.numbers || "?"}`;
  return "whole team";
}
function renderRunList() {
  $("#runList").innerHTML = sortedQ().map(([id, q], i) => `
    <button class="run-item ${id === selQid ? "sel" : ""} ${id === game.qid ? "live" : ""}" data-id="${id}">
      <span class="ri-n">${i + 1}</span><span class="ri-t">${TYPE_ICON[q.type] || ""} ${esc(q.title_en || q.title_ar || "Untitled")}</span>
      <span class="ri-s">${q.practice ? "practice · " : ""}${targetLabel(q)}${q.inputMode === "each" ? " · everyone" : ""}</span>
      ${applied[id] ? `<span class="ri-badge">✓ scored</span>` : ""}${id === game.qid ? `<span class="ri-badge live">LIVE</span>` : ""}
    </button>`).join("") || `<p class="muted">No questions yet — add some in the Questions tab (or Load samples).</p>`;
  $$("#runList .run-item").forEach(b => b.onclick = () => { selQid = b.dataset.id; renderRunList(); renderPreview(); updateControls(); });
}
function scoringLabel(q) {
  return ({ speed: "fastest correct", closest: "closest number", correct: "all correct", participation: "participation %", manual: "judged by host" })[q.scoring] || q.scoring;
}
function renderPreview() {
  const q = questions[selQid];
  if (!q) { $("#selPreview").innerHTML = `<span class="muted">Pick a question from the run order.</span>`; return; }
  $("#selPreview").innerHTML = `
    <h2>${qIndex(selQid)}. ${TYPE_ICON[q.type] || ""} ${esc(q.title_en)} <span class="muted" dir="rtl">${esc(q.title_ar || "")}</span></h2>
    ${q.body_en ? `<p>${esc(q.body_en)}</p>` : ""}
    <div class="chips">
      <span class="chip">${q.type}</span><span class="chip">${q.inputMode === "each" ? "every player answers" : "one answer per team"}</span>
      <span class="chip">${targetLabel(q)}</span><span class="chip">${q.timeLimit ? q.timeLimit + "s" : "no timer"}</span>
      <span class="chip">${scoringLabel(q)}: ${esc(q.points)}</span>${q.wrongPenalty ? `<span class="chip">−${q.wrongPenalty} if wrong</span>` : ""}
      ${q.practice ? `<span class="chip">practice</span>` : ""}
    </div>
    ${q.answer !== "" && q.answer != null ? `<p><b>Answer:</b> ${esc(q.type === "choice" ? (qOptions(q, "en")[Number(q.answer) - 1] || q.answer) : q.answer)}</p>` : ""}
    ${q.notes ? `<p class="notes">📝 ${esc(q.notes)}</p>` : ""}`;
}

function updateControls() {
  const ph = game.phase || "lobby", live = !!game.qid && ph !== "lobby";
  const isPhoto = live && questions[game.qid] && (questions[game.qid].type === "photo" || questions[game.qid].requirePhoto);
  $("#bLaunch").disabled = !selQid;
  $("#bLaunchStart").disabled = !selQid;
  $("#bStart").disabled = ph !== "show";
  $("#bAdd").disabled = !(ph === "open" || ph === "locked");
  $("#bLock").disabled = ph !== "open";
  $("#bGrade").disabled = !live;
  $("#bReveal").disabled = !live;
  $("#bGallery").disabled = !isPhoto;
}

function tick() {
  const el = $("#hostTimer");
  if (game.phase === "open" && game.endsAt) {
    const left = game.endsAt - serverNow();
    el.textContent = left > 0 ? `⏱ ${Math.ceil(left / 1000)}s` : "⏱ 0s";
    if (left < -1200 && lockSentFor !== game.endsAt) { lockSentFor = game.endsAt; update(ref(db, "game"), { phase: "locked" }); } // auto-lock
  } else el.textContent = game.phase === "open" ? "⏱ no limit" : "";
}

// ---------------- LIVE: actions ----------------
function publicCopy(q, qid) {
  const keep = ["type", "title_en", "title_ar", "body_en", "body_ar", "image", "options_en", "options_ar",
    "inputMode", "target", "timeLimit", "practice", "requirePhoto", "scoring"];
  const o = { qid };
  keep.forEach(k => { if (q[k] !== undefined) o[k] = q[k]; });
  return o;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

async function launch(start) {
  const qid = selQid, q = questions[qid];
  if (!q) return;
  if (!teamIds().length) return toast("Create teams first (Teams tab).", "bad");
  if (game.phase === "open" && game.qid !== qid && !confirm("Another question is still open. Switch anyway?")) return;
  if (applied[qid] && !confirm("This question was already scored. Run it again? (Re-grading will replace its points.)")) return;
  const upd = { [`submissions/${qid}`]: null, [`images/${qid}`]: null, [`secrets/${qid}`]: null };
  const assignObj = {};
  for (const tid of teamIds()) {
    const tp = players[tid] || {};
    const picked = pickPlayers(q, tp, played[tid] || {});
    const a = Object.fromEntries(picked.map(p => [p, true]));
    if ((q.target || "all") === "all") a._all = true; // late joiners can answer too
    assignObj[tid] = Object.keys(a).length ? a : { _all: true };
    for (const p of picked) upd[`played/${tid}/${p}`] = ((played[tid] || {})[p] || 0) + 1;
    if (q.type === "lineup" && picked.length) {
      const range = Number(q.lineupRange) || 0;
      let nums;
      if (range >= picked.length) { const s = new Set(); while (s.size < picked.length) s.add(1 + Math.floor(Math.random() * range)); nums = [...s]; }
      else nums = shuffle(picked.map((_, i) => i + 1));
      picked.forEach((p, i) => { upd[`secrets/${qid}/${tid}/${p}`] = nums[i]; });
    }
  }
  upd[`assign/${qid}`] = assignObj;
  upd.live = publicCopy(q, qid);
  const now = serverNow();
  upd.game = {
    ...game, qid, phase: start ? "open" : "show",
    endsAt: start && q.timeLimit ? now + q.timeLimit * 1000 : 0,
    openedAt: start ? now : 0, reveal: null, gallery: false, spotlight: null
  };
  gradeResult = null; gradeQid = null; $("#gradePanel").classList.add("hidden");
  await update(ref(db), upd);
}
$("#bLaunch").onclick = () => launch(false);
$("#bLaunchStart").onclick = () => launch(true);
$("#bStart").onclick = () => {
  const q = questions[game.qid] || {}, now = serverNow();
  update(ref(db, "game"), { phase: "open", openedAt: now, endsAt: q.timeLimit ? now + q.timeLimit * 1000 : 0 });
};
$("#bAdd").onclick = () => {
  const now = serverNow();
  const base = game.phase === "open" && game.endsAt ? Math.max(game.endsAt, now) : now;
  update(ref(db, "game"), { phase: "open", endsAt: base + 15000 });
};
$("#bLock").onclick = () => update(ref(db, "game"), { phase: "locked" });
$("#bLobby").onclick = () => update(ref(db, "game"), { phase: "lobby", gallery: false, spotlight: null });
$("#bGallery").onclick = () => update(ref(db, "game"), { gallery: !game.gallery, spotlight: null });
$("#bBoard").onclick = () => update(ref(db, "game"), game.showBoard ? { showBoard: false, boardSince: serverNow() } : { showBoard: true });

// ---------------- LIVE: answers ----------------
function renderLiveSubs() {
  const box = $("#liveSubs");
  if (!box) return;
  const q = questions[game.qid];
  if (!q || !game.qid || game.phase === "lobby") { box.innerHTML = `<p class="muted">Nothing live.</p>`; $("#liveCount").textContent = ""; return; }
  let done = 0;
  box.innerHTML = teamIds().map(tid => {
    const tm = teams[tid], a = assignQ[tid] || {}, s = subsQ[tid] || {}, im = imagesQ[tid] || {}, tp = players[tid] || {};
    const duty = a._all ? Object.keys(tp) : Object.keys(a).filter(k => k !== "_all");
    const teamDone = q.inputMode === "team" ? !!s.team : duty.length > 0 && duty.every(p => s[p]);
    if (teamDone) done++;
    const dutyHTML = duty.filter(p => tp[p]).sort((x, y) => tp[x].number - tp[y].number).map(p =>
      `<span class="chip ${s[p] || (s.team && s.team.playerId === p) ? "ok" : ""} ${tp[p].online ? "" : "offline"}">#${tp[p].number} ${esc(tp[p].name)}</span>`).join("");
    const entries = Object.entries(s);
    const ansHTML = entries.sort((x, y) => x[1].time - y[1].time).map(([sid, e]) => `
      <div class="sub-row">
        <span class="sub-t">${game.openedAt ? ((e.time - game.openedAt) / 1000).toFixed(1) + "s" : ""}</span>
        <b>${esc(q.type === "choice" ? (qOptions(q, "en")[Number(e.value)] ?? e.value) : e.value)}</b>
        <span class="muted">— #${e.number || "?"} ${esc(e.name)}</span>
        ${im[sid] ? `<img class="thumb" src="${im[sid]}" data-tid="${tid}" data-sid="${sid}">` : ""}
      </div>`).join("");
    return `<div class="sub-card ${teamDone ? "done" : ""}" style="--c:${esc(tm.color)}">
      <div class="sub-head"><span class="dot"></span><b>${esc(tm.name)}</b>${teamDone ? " ✅" : ""}</div>
      <div class="chips small">${dutyHTML || `<span class="muted">no players</span>`}</div>
      ${ansHTML || `<p class="muted">waiting…</p>`}</div>`;
  }).join("");
  $("#liveCount").textContent = `${done}/${teamIds().length} teams done`;
  $$("#liveSubs .thumb").forEach(img => img.onclick = () => openLightbox(img.src, img.dataset.tid, img.dataset.sid));
}

function openLightbox(src, tid, sid) {
  const lb = $("#lightbox");
  lb.querySelector("img").src = src;
  lb.querySelector(".lb-actions").innerHTML = `<button class="btn" id="lbShow">📺 Show this on the projector</button><button class="btn ghost" id="lbClose">Close</button>`;
  lb.classList.remove("hidden");
  $("#lbShow").onclick = () => { update(ref(db, "game"), { spotlight: { teamId: tid, sid }, gallery: true }); lb.classList.add("hidden"); };
  $("#lbClose").onclick = () => lb.classList.add("hidden");
}
$("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") e.currentTarget.classList.add("hidden"); });

// ---------------- LIVE: grading ----------------
$("#bGrade").onclick = () => {
  const qid = game.qid, q = questions[qid];
  if (!q) return;
  gradeResult = grade(q, teamIds(), assignQ, subsQ, players, game.openedAt || 0);
  gradeQid = qid;
  const prev = applied[qid] && applied[qid].values;
  const panel = $("#gradePanel");
  panel.classList.remove("hidden");
  panel.innerHTML = `<h3>Points for Q${qIndex(qid)} ${q.practice ? "(practice — no points)" : ""}</h3>
    ${prev ? `<p class="hint">Already applied once — applying again replaces those points.</p>` : ""}
    <table class="grade-table"><thead><tr><th>Team</th><th>Result</th><th>Auto</th><th>Final</th></tr></thead><tbody>
    ${teamIds().map(tid => `<tr><td><span class="dot" style="background:${esc(teams[tid].color)}"></span> ${esc(teams[tid].name)}</td>
      <td>${esc(gradeResult[tid].summary)}</td><td>${gradeResult[tid].auto}</td>
      <td><input type="number" data-tid="${tid}" value="${prev && prev[tid] != null ? prev[tid] : gradeResult[tid].auto}"></td></tr>`).join("")}
    </tbody></table>
    <div class="row-btns"><button class="btn big" id="bApply">✅ Apply points</button>
    <button class="btn ghost" id="bApplyReveal">✅ Apply &amp; reveal</button>
    <button class="btn ghost" id="bGradeClose">Close</button></div>`;
  $("#bApply").onclick = applyPoints;
  $("#bApplyReveal").onclick = async () => { await applyPoints(); await reveal(); };
  $("#bGradeClose").onclick = () => panel.classList.add("hidden");
};

function finalValues() {
  const v = {};
  $$("#gradePanel input[data-tid]").forEach(inp => v[inp.dataset.tid] = Math.round(Number(inp.value) || 0));
  return v;
}
async function applyPoints() {
  const qid = gradeQid, q = questions[qid];
  if (!q) return;
  const values = finalValues(), upd = {};
  for (const [id, e] of Object.entries(ledger)) if (e.kind === "round" && e.qid === qid) upd[`ledger/${id}`] = null;
  const reason = `Q${qIndex(qid)}: ${[q.title_en, q.title_ar].filter(Boolean).join(" · ")}`;
  for (const [tid, v] of Object.entries(values)) {
    if (!v || q.practice) continue;
    upd[`ledger/${push(ref(db, "ledger")).key}`] = { teamId: tid, delta: v, reason, qid, kind: "round", time: serverTimestamp() };
  }
  upd[`applied/${qid}`] = { time: serverTimestamp(), values };
  await update(ref(db), upd);
  toast("Points applied ✓ — show the scoreboard when you're ready.", "good");
}

function revealText(q, l) {
  if (q[`reveal_${l}`]) return q[`reveal_${l}`];
  if (q.type === "text") {
    const parts = String(q.answer || "").split("|").map(s => s.trim()).filter(Boolean);
    const ar = parts.find(p => /[؀-ۿ]/.test(p)), en = parts.find(p => !/[؀-ۿ]/.test(p));
    return l === "ar" ? (ar || en || "") : (en || ar || "");
  }
  if (q.type === "number") return String(q.answer ?? "");
  if (q.type === "choice") return qOptions(q, l)[Number(q.answer) - 1] || "";
  return "";
}
async function reveal() {
  const qid = game.qid, q = questions[qid];
  if (!q) return;
  const auto = grade(q, teamIds(), assignQ, subsQ, players, game.openedAt || 0);
  const vals = (gradeQid === qid && $("#gradePanel input[data-tid]")) ? finalValues() : ((applied[qid] && applied[qid].values) || {});
  const results = {};
  for (const tid of teamIds()) results[tid] = { points: q.practice ? 0 : (vals[tid] ?? auto[tid].auto), summary: auto[tid].summary };
  await update(ref(db, "game"), { phase: "reveal", reveal: { answer_en: revealText(q, "en"), answer_ar: revealText(q, "ar"), results } });
}
$("#bReveal").onclick = reveal;

// ---------------- LIVE: adjustments ----------------
function renderAdjust() {
  const tot = totals(ledger, teamIds());
  $("#adjTeams").innerHTML = teamIds().map(tid => `
    <div class="adj-row" style="--c:${esc(teams[tid].color)}">
      <div class="adj-name"><span class="dot"></span><b>${esc(teams[tid].name)}</b><span class="adj-total">${tot[tid]}</span></div>
      <div class="adj-btns">
        ${[-20, -10, -5, 5, 10, 20].map(d => `<button class="${d < 0 ? "neg" : "pos"}" data-tid="${tid}" data-d="${d}">${d > 0 ? "+" : ""}${d}</button>`).join("")}
        <input type="number" placeholder="±" data-custom="${tid}"><button class="go" data-go="${tid}">OK</button>
      </div>
    </div>`).join("") || `<p class="muted">No teams yet.</p>`;
  $$("#adjTeams [data-d]").forEach(b => b.onclick = () => adjust(b.dataset.tid, Number(b.dataset.d)));
  $$("#adjTeams [data-go]").forEach(b => b.onclick = () => {
    const inp = $(`#adjTeams [data-custom="${b.dataset.go}"]`);
    const d = Math.round(Number(inp.value)); if (d) { adjust(b.dataset.go, d); inp.value = ""; }
  });
}
async function adjust(tid, delta) {
  const reason = $("#adjReason").value.trim() || (delta < 0 ? "Rule break" : "Bonus");
  await push(ref(db, "ledger"), { teamId: tid, delta, reason, kind: delta < 0 ? "penalty" : "bonus", time: serverTimestamp() });
  toast(`${esc(teams[tid].name)} ${delta > 0 ? "+" : ""}${delta} — ${esc(reason)}`, delta < 0 ? "bad" : "good", 2500);
}

// ---------------- QUESTIONS ----------------
const form = $("#qForm");
const NUMS = ["timeLimit", "groupSize", "lineupRange", "wrongPenalty", "tolerance"];
const CHECKS = ["requirePhoto", "practice"];
function formToQ() {
  const f = new FormData(form), q = {};
  for (const [k, v] of f.entries()) q[k] = typeof v === "string" ? v.trim() : v;
  NUMS.forEach(k => q[k] = Number(q[k]) || 0);
  CHECKS.forEach(k => q[k] = !!form.elements[k].checked);
  q.options_en = (q.options_en || "").split("\n").map(s => s.trim()).filter(Boolean);
  q.options_ar = (q.options_ar || "").split("\n").map(s => s.trim()).filter(Boolean);
  return q;
}
function qToForm(q) {
  form.reset();
  for (const el of form.elements) {
    if (!el.name) continue;
    const v = q[el.name];
    if (el.type === "checkbox") el.checked = !!v;
    else if (Array.isArray(v)) el.value = v.join("\n");
    else if (v !== undefined) el.value = v;
  }
  syncFormExtras();
}
function syncFormExtras() {
  const type = form.elements.type.value, target = form.elements.target.value;
  $$(".type-extra", form).forEach(el => el.classList.toggle("hidden", !el.dataset.for.split(" ").includes(type)));
  showImgPrev();
  $$(".target-extra", form).forEach(el => el.classList.toggle("hidden", el.dataset.for !== target));
  const hints = {
    speed: "Teams with a correct answer are ranked by speed: 1st gets the first number, 2nd the second… In “every player” mode the team's time is when its LAST player answers, and points scale with how many got it right.",
    closest: "Ranked by how close the number is to the answer (ties share a rank). Use a number answer type.",
    correct: "Every correct team gets the first number. In “every player” mode it's scaled by the share who got it right.",
    participation: "First number × the share of on-duty players who answered. Great for EVERYONE-IS-IMPORTANT rounds.",
    manual: "Nothing is auto-scored — you type the points after looking at the answers/photos."
  };
  $("#scoreHint").textContent = hints[form.elements.scoring.value] || "";
}
form.addEventListener("change", syncFormExtras);
function showImgPrev() {
  const v = form.elements.image.value.trim();
  $("#qImgPrev").classList.toggle("hidden", !v);
  if (v) $("#qImgPrev").src = v;
}
form.elements.image.addEventListener("input", showImgPrev);
$("#qImgFile").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { form.elements.image.value = await compressImage(f, 1000, 0.75); showImgPrev(); $("#qMsg").textContent = "Picture added — press Save."; }
  catch { $("#qMsg").textContent = "Couldn't read that picture."; }
  e.target.value = "";
};
$("#qImgClear").onclick = () => { form.elements.image.value = ""; showImgPrev(); };

function renderQList() {
  const list = sortedQ();
  $("#qList").innerHTML = list.map(([id, q], i) => `
    <div class="q-row ${id === editQid ? "sel" : ""} ${picked.has(id) ? "picked" : ""}" draggable="true" data-id="${id}">
      <input type="checkbox" class="q-check" data-check="${id}" ${picked.has(id) ? "checked" : ""} title="Select">
      <span class="q-grip" title="Drag to move">⠿</span>
      <button type="button" class="q-pos" data-pos="${id}" title="Click to move to a position">${i + 1}</button>
      <span class="q-name">${TYPE_ICON[q.type] || ""} ${esc(q.title_en || q.title_ar || "Untitled")}</span>
      <span class="q-arrows">
        <button type="button" data-mv="-1" data-id="${id}" title="Move up" ${i === 0 ? "disabled" : ""}>▲</button>
        <button type="button" data-mv="1" data-id="${id}" title="Move down" ${i === list.length - 1 ? "disabled" : ""}>▼</button>
        <button type="button" data-dup="${id}" title="Duplicate (copy goes right below)">⧉</button>
      </span>
    </div>`).join("") || `<p class="muted">No questions yet.</p>`;

  $$("#qList .q-row").forEach(row => {
    row.onclick = e => { if (!e.target.closest("button, input")) editQ(row.dataset.id); };
    row.ondragstart = e => { dragId = row.dataset.id; row.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); };
    row.ondragend = () => { dragId = null; $$("#qList .q-row").forEach(r => r.classList.remove("dragging", "drop-above", "drop-below")); };
    row.ondragover = e => {
      if (!dragId || dragId === row.dataset.id) return;
      e.preventDefault();
      const below = e.offsetY > row.offsetHeight / 2;
      $$("#qList .q-row").forEach(r => r.classList.remove("drop-above", "drop-below"));
      row.classList.add(below ? "drop-below" : "drop-above");
    };
    row.ondrop = e => {
      e.preventDefault();
      if (!dragId || dragId === row.dataset.id) return;
      const below = row.classList.contains("drop-below");
      const ids = sortedQ().map(([id]) => id).filter(id => id !== dragId);
      ids.splice(ids.indexOf(row.dataset.id) + (below ? 1 : 0), 0, dragId);
      saveOrder(ids);
    };
  });
  $$("#qList [data-mv]").forEach(b => b.onclick = () => moveBy(b.dataset.id, Number(b.dataset.mv)));
  $$("#qList [data-dup]").forEach(b => b.onclick = async () => { const [k] = await duplicate([b.dataset.dup]); editQ(k); });
  $$("#qList [data-check]").forEach(cb => cb.onclick = e => {
    const ids = sortedQ().map(([x]) => x), i = ids.indexOf(cb.dataset.check);
    // Shift-click selects everything between the last click and this one
    const range = e.shiftKey && lastPick >= 0 ? ids.slice(Math.min(i, lastPick), Math.max(i, lastPick) + 1) : [cb.dataset.check];
    range.forEach(id => cb.checked ? picked.add(id) : picked.delete(id));
    lastPick = i;
    renderQList();
  });
  updateBulk();
  $$("#qList [data-pos]").forEach(b => b.onclick = () => {
    const ids = sortedQ().map(([id]) => id);
    const to = Number(prompt(`Move this question to position (1–${ids.length}):`, ids.indexOf(b.dataset.pos) + 1));
    if (!to) return;
    moveTo(b.dataset.pos, Math.min(ids.length, Math.max(1, Math.round(to))) - 1);
  });
}
let dragId = null;
const picked = new Set();   // questions ticked in the list
let lastPick = -1;
function updateBulk() {
  for (const id of [...picked]) if (!questions[id]) picked.delete(id);
  const n = picked.size, total = Object.keys(questions).length;
  $("#qSelCount").textContent = n ? `${n} selected` : "";
  $("#qBulkDup").disabled = !n; $("#qBulkDel").disabled = !n;
  $("#qBulkDel").textContent = n ? `🗑 Delete ${n}` : "🗑 Delete";
  const all = $("#qSelAll");
  all.checked = total > 0 && n === total; all.indeterminate = n > 0 && n < total;
}
// Copies each question and puts the copy right under its original. Returns the new ids.
async function duplicate(ids) {
  const list = sortedQ().map(([x]) => x), newIds = [], upd = {}, order = [];
  for (const id of list) {
    order.push(id);
    if (ids.includes(id)) {
      const k = push(ref(db, "questions")).key;
      upd[`questions/${k}`] = { ...questions[id] };
      order.push(k); newIds.push(k);
    }
  }
  order.forEach((id, i) => { if (upd[`questions/${id}`]) upd[`questions/${id}`].order = i + 1; else upd[`questions/${id}/order`] = i + 1; });
  await update(ref(db), upd);
  toast(newIds.length === 1 ? "Duplicated — the copy is right below the original." : `Duplicated ${newIds.length} questions.`, "good", 2500);
  return newIds;
}
async function deleteQuestions(ids) {
  const upd = {};
  ids.forEach(id => { upd[`questions/${id}`] = null; upd[`applied/${id}`] = null; });
  if (ids.includes(game.qid) && game.phase !== "lobby") upd.game = { ...game, phase: "lobby", gallery: false, spotlight: null };
  await update(ref(db), upd);
  ids.forEach(id => picked.delete(id));
  if (ids.includes(editQid)) editQ(null);
  if (ids.includes(selQid)) { selQid = null; renderPreview(); }
  toast(`Deleted ${ids.length} question${ids.length === 1 ? "" : "s"}.`, "good", 2500);
}
// Writes order 1..n for every question in one go, so positions never clash.
async function saveOrder(ids) {
  const upd = {};
  ids.forEach((id, i) => { upd[`questions/${id}/order`] = i + 1; });
  await update(ref(db), upd);
}
function moveTo(id, index) {
  const ids = sortedQ().map(([x]) => x).filter(x => x !== id);
  ids.splice(index, 0, id);
  return saveOrder(ids);
}
function moveBy(id, dir) {
  const ids = sortedQ().map(([x]) => x), i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  return moveTo(id, j);
}
function editQ(id) {
  editQid = id;
  $("#qFormTitle").textContent = id ? `Edit question ${qIndex(id)}` : "New question";
  qToForm(id ? questions[id] : { type: "text", inputMode: "team", target: "all", scoring: "speed", points: "100,70,50,30", timeLimit: 30, groupSize: 2 });
  $("#qMsg").textContent = "";
  renderQList();
}
$("#qNew").onclick = () => editQ(null);
form.onsubmit = async e => {
  e.preventDefault();
  const q = formToQ();
  if (!q.title_en && !q.title_ar) { $("#qMsg").textContent = "Give it a title (English or Arabic)."; return; }
  if (q.type === "choice" && !q.options_en.length && !q.options_ar.length) { $("#qMsg").textContent = "Add the choices (one per line)."; return; }
  if (editQid) { q.order = questions[editQid].order; await set(ref(db, `questions/${editQid}`), q); }
  else {
    q.order = Math.max(0, ...Object.values(questions).map(x => x.order || 0)) + 1;
    editQid = push(ref(db, "questions")).key;
    await set(ref(db, `questions/${editQid}`), q);
  }
  $("#qMsg").textContent = "Saved ✓";
  $("#qFormTitle").textContent = `Edit question ${qIndex(editQid)}`;
};
$("#qDup").onclick = async () => { if (!editQid) return; const [k] = await duplicate([editQid]); editQ(k); };
$("#qSelAll").onchange = e => { if (e.target.checked) sortedQ().forEach(([id]) => picked.add(id)); else picked.clear(); renderQList(); };
$("#qBulkDup").onclick = async () => { await duplicate([...picked]); picked.clear(); renderQList(); };
$("#qBulkDel").onclick = async () => {
  const ids = [...picked].filter(id => questions[id]);
  if (!ids.length) return;
  const names = ids.slice(0, 5).map(id => "• " + (questions[id].title_en || questions[id].title_ar || "Untitled")).join("\n");
  if (!confirm(`Delete ${ids.length} question${ids.length === 1 ? "" : "s"}?\n\n${names}${ids.length > 5 ? `\n…and ${ids.length - 5} more` : ""}`)) return;
  await deleteQuestions(ids);
};
function move(dir) { if (editQid) moveBy(editQid, dir); }
$("#qUp").onclick = () => move(-1);
$("#qDown").onclick = () => move(1);
$("#qDel").onclick = async () => {
  if (!editQid || !confirm("Delete this question?")) return;
  await remove(ref(db, `questions/${editQid}`)); editQ(null);
};
$("#qSamples").onclick = async () => {
  const has = Object.keys(questions).length;
  if (has && !confirm(`Add the ${SAMPLE_QUESTIONS.length} camp questions after your ${has} existing ones?\n(To start clean, press “Delete all” first.)`)) return;
  let order = Math.max(0, ...Object.values(questions).map(x => x.order || 0));
  const upd = {};
  for (const q of SAMPLE_QUESTIONS) upd[`questions/${push(ref(db, "questions")).key}`] = { ...q, order: ++order };
  await update(ref(db), upd);
  toast(`Added ${SAMPLE_QUESTIONS.length} questions`, "good");
};
$("#qDelAll").onclick = async () => {
  const n = Object.keys(questions).length;
  if (!n || !confirm(`Delete ALL ${n} questions? This can't be undone (use ⬇ Export first if you want a backup).`)) return;
  if (game.phase && game.phase !== "lobby") await update(ref(db, "game"), { phase: "lobby", gallery: false, spotlight: null });
  await update(ref(db), { questions: null, applied: null });
  editQ(null); selQid = null; renderPreview();
  toast(`Deleted ${n} questions`, "good");
};
$("#qExport").onclick = () => {
  const data = sortedQ().map(([, q]) => q);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = "questions.json"; a.click();
};
$("#qImport").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const arr = JSON.parse(await f.text());
    if (!Array.isArray(arr)) throw 0;
    let order = Math.max(0, ...Object.values(questions).map(x => x.order || 0));
    const upd = {};
    for (const q of arr) upd[`questions/${push(ref(db, "questions")).key}`] = { ...q, order: ++order };
    await update(ref(db), upd);
    toast(`Imported ${arr.length} questions`, "good");
  } catch { toast("That file isn't a questions export.", "bad"); }
  e.target.value = "";
};
editQ(null);

// ---------------- TEAMS ----------------
$("#teamForm").onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = f.get("name").trim(), color = f.get("color"), email = f.get("email").trim().toLowerCase(), password = f.get("password");
  $("#teamMsg").textContent = "Creating…";
  const sec = initializeApp(firebaseConfig, "sec-" + Date.now());
  const sa = getAuth(sec);
  try {
    let cred;
    try { cred = await createUserWithEmailAndPassword(sa, email, password); }
    catch (err) {
      if (err.code !== "auth/email-already-in-use") throw err;
      cred = await secSignIn(sa, email, password); // re-link an existing team login
    }
    const uid = cred.user.uid;
    const tid = push(ref(db, "teams")).key;
    await update(ref(db), { [`teams/${tid}`]: { name, color, email, uid }, [`teamByUid/${uid}`]: tid });
    $("#teamMsg").textContent = `Team “${name}” created. Login: ${email} / ${password}`;
    e.target.reset();
    e.target.elements.color.value = COLORS[Object.keys(teams).length % COLORS.length];
  } catch (err) {
    console.error(err);
    $("#teamMsg").textContent = "Couldn't create team: " + (err.code || err.message) +
      (err.code === "auth/operation-not-allowed" ? " — enable Email/Password sign-in in Firebase Authentication." : "");
  } finally { await secSignOut(sa).catch(() => {}); await deleteApp(sec).catch(() => {}); }
};

function renderTeams() {
  const box = $("#teamCards");
  if (!box) return;
  box.innerHTML = teamIds().map(tid => {
    const tm = teams[tid], tp = players[tid] || {}, pl = played[tid] || {};
    const list = Object.entries(tp).sort((a, b) => a[1].number - b[1].number);
    const turns = list.map(([id]) => pl[id] || 0);
    const minT = turns.length ? Math.min(...turns) : 0;
    return `<div class="card team-card" style="--c:${esc(tm.color)}">
      <div class="tc-head"><span class="dot big"></span><h3>${esc(tm.name)}</h3><span class="muted">${esc(tm.email)}</span>
        <span class="spacer"></span><span class="muted">${list.filter(([, p]) => p.online).length}/${list.length} online</span></div>
      <table class="players"><thead><tr><th>#</th><th>Name</th><th>Turns</th><th></th></tr></thead><tbody>
      ${list.map(([id, p]) => `<tr class="${p.online ? "" : "offline"}">
        <td>${p.number}</td><td><span class="online-dot ${p.online ? "on" : ""}"></span>${esc(p.name)}</td>
        <td><span class="turns ${(pl[id] || 0) === minT ? "low" : ""}">${pl[id] || 0}</span></td>
        <td class="actions"><button data-act="rename" data-tid="${tid}" data-pid="${id}" title="Rename">✏️</button>
        <button data-act="kick" data-tid="${tid}" data-pid="${id}" title="Remove">✖</button></td></tr>`).join("") || `<tr><td colspan="4" class="muted">No players yet</td></tr>`}
      </tbody></table>
      <div class="row-btns">
        <button class="btn ghost" data-act="renumber" data-tid="${tid}">Renumber 1…${list.length}</button>
        <button class="btn ghost" data-act="editteam" data-tid="${tid}">Rename / recolor</button>
        <button class="btn danger" data-act="delteam" data-tid="${tid}">Delete team</button>
      </div></div>`;
  }).join("");
  $$("#teamCards [data-act]").forEach(b => b.onclick = () => teamAction(b.dataset.act, b.dataset.tid, b.dataset.pid));
}
async function teamAction(act, tid, pid) {
  const tp = players[tid] || {};
  if (act === "rename") {
    const n = prompt("Real full name:", tp[pid].name);
    if (n && n.trim()) await update(ref(db, `players/${tid}/${pid}`), { name: n.trim() });
  } else if (act === "kick") {
    if (confirm(`Remove ${tp[pid].name}? Their phone goes back to the name screen.`)) await remove(ref(db, `players/${tid}/${pid}`));
  } else if (act === "renumber") {
    const list = Object.entries(tp).sort((a, b) => a[1].number - b[1].number), upd = {};
    list.forEach(([id], i) => upd[`players/${tid}/${id}/number`] = i + 1);
    upd[`counters/${tid}`] = list.length;
    await update(ref(db), upd);
  } else if (act === "editteam") {
    const n = prompt("Team name:", teams[tid].name); if (!n) return;
    const c = prompt("Color (hex, e.g. #ff5a5f):", teams[tid].color) || teams[tid].color;
    await update(ref(db, `teams/${tid}`), { name: n.trim(), color: c.trim() });
  } else if (act === "delteam") {
    if (!confirm(`Delete team ${teams[tid].name}, its players and points? (The login itself stays in Firebase Authentication.)`)) return;
    const upd = { [`teams/${tid}`]: null, [`teamByUid/${teams[tid].uid}`]: null, [`players/${tid}`]: null, [`counters/${tid}`]: null, [`played/${tid}`]: null };
    for (const [id, e] of Object.entries(ledger)) if (e.teamId === tid) upd[`ledger/${id}`] = null;
    await update(ref(db), upd);
  }
}
async function reset(all) {
  // Everything that a game produces. Teams, questions and look & feel are not touched.
  const upd = {
    submissions: null, images: null, assign: null, secrets: null, ledger: null, applied: null,
    played: null, live: null, game: { phase: "lobby", showBoard: false, boardSince: serverNow() }
  };
  if (all) { upd.players = null; upd.counters = null; }
  await update(ref(db), upd);
  gradeResult = null; gradeQid = null; selQid = null;
  $("#gradePanel").classList.add("hidden");
  renderPreview(); renderRunList();
  toast(all ? "Everything reset — players need to type their names again." : "Fresh start — all scores, grades and answers cleared.", "good");
}
$("#resetGame").onclick = () => confirm("Clear ALL points, answers and turn counts? Players stay.") && reset(false);
$("#resetAll").onclick = () => confirm("Clear EVERYTHING including all players? Teams and questions stay.") && reset(true);

// ---------------- SCORES ----------------
function renderScores() {
  const box = $("#totalsTable");
  if (!box) return;
  const tot = totals(ledger, teamIds());
  box.innerHTML = `<table class="grade-table"><tbody>${teamIds().sort((a, b) => tot[b] - tot[a]).map((tid, i) =>
    `<tr><td>${i + 1}</td><td><span class="dot" style="background:${esc(teams[tid].color)}"></span> ${esc(teams[tid].name)}</td><td><b>${tot[tid]}</b></td></tr>`).join("")}</tbody></table>`;
  const rows = Object.entries(ledger).sort((a, b) => (b[1].time || 0) - (a[1].time || 0));
  $("#ledgerTable").innerHTML = `<table class="grade-table"><thead><tr><th>Time</th><th>Team</th><th>Change</th><th>Reason</th><th></th></tr></thead><tbody>
    ${rows.map(([id, e]) => `<tr><td class="muted">${e.time ? new Date(e.time).toLocaleTimeString() : ""}</td>
      <td>${esc(teams[e.teamId]?.name || "?")}</td><td class="${e.delta < 0 ? "neg" : "pos"}"><b>${e.delta > 0 ? "+" : ""}${e.delta}</b></td>
      <td>${esc(e.reason || "")}</td><td><button class="link-btn" data-undo="${id}">undo</button></td></tr>`).join("") || `<tr><td colspan="5" class="muted">No points yet</td></tr>`}
    </tbody></table>`;
  $$("#ledgerTable [data-undo]").forEach(b => b.onclick = () => confirm("Remove this point change?") && remove(ref(db, `ledger/${b.dataset.undo}`)));
}

// ---------------- LOOK & FEEL ----------------
function renderLook(st) {
  $("#lookBgPrev").src = st.background || GAME.background;
  $("#lookLogoPrev").src = st.logo || GAME.logo;
  if (st.brand) $("#lookBrand").value = st.brand;
  $("#lookOverlay").value = st.overlay ?? 0.6;
}
const saveLook = async (patch, msg) => { await update(ref(db, "settings"), patch); $("#lookMsg").textContent = msg || "Saved ✓"; };
$("#lookBg").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  $("#lookMsg").textContent = "Uploading…";
  try { await saveLook({ background: await compressImage(f, 1920, 0.82, "image/jpeg", 1500000) }, "Background updated ✓"); }
  catch (err) { console.error(err); $("#lookMsg").textContent = "Couldn't use that image — try a JPG or PNG."; }
  e.target.value = "";
};
$("#lookLogo").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { await saveLook({ logo: await compressImage(f, 600, 0.9, "image/png") }, "Logo updated ✓"); }
  catch (err) { console.error(err); $("#lookMsg").textContent = "Couldn't use that image."; }
  e.target.value = "";
};
$("#lookBgClear").onclick = () => saveLook({ background: null }, "Back to the default background");
$("#lookLogoClear").onclick = () => saveLook({ logo: null }, "Using assets/logo.png");
$("#lookBrand").onchange = e => saveLook({ brand: e.target.value });
$("#lookBrandClear").onclick = () => saveLook({ brand: null }, "Accent color reset");
$("#lookOverlay").onchange = e => saveLook({ overlay: Number(e.target.value) });
