// Player phone app
import {
  auth, db, ref, onValue, get, set, update, push, runTransaction, serverTimestamp, onDisconnect,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, serverNow,
  $, $$, esc, t, b, tp, pair, textPair, qb, lang, setLang, applyLang, applyBranding, configBanner, qt, qOptions,
  isRealName, titleCase, compressImage, toast, watchLedger, adjustmentToast, renderBoard, TYPE_ICON, authProblem, rulesList
} from "./common.js";
import { checkVersions } from "./common.js";
export const PAGE_VERSION = "2026-10-21";
checkVersions("player.js", PAGE_VERSION);

let teamId = null, teams = {}, players = {}, pid = null, game = {}, live = null;
let assign = {}, subs = {}, secret = null, ledger = {};
let unsubs = [], qUnsubs = [], viewKey = "", boardFrom = null, boardOpen = false, timerHandle = null;
let selectedChoice = null, pendingImage = null;

applyLang(); applyBranding();
if (configBanner()) throw new Error("Firebase not configured");

$("#langBtn").onclick = () => { setLang(lang() === "ar" ? "en" : "ar"); $("#langBtn").textContent = lang() === "ar" ? "EN" : "ع"; viewKey = ""; render(); renderReclaim(); };
$("#langBtn").textContent = lang() === "ar" ? "EN" : "ع";

function show(id) { $$(".view").forEach(v => v.classList.toggle("hidden", v.id !== id)); }

// ---------------- sign in ----------------
$("#loginForm").onsubmit = async e => {
  e.preventDefault();
  $("#loginErr").textContent = "";
  try { await signInWithEmailAndPassword(auth, $("#loginEmail").value.trim(), $("#loginPass").value); }
  catch (err) { console.error(err); { const pr = authProblem(err); $("#loginErr").innerHTML = pr ? esc(pr) : b("wrong_login"); } }
};
const logout = async () => { if (teamId) localStorage.removeItem("tc_pid_" + teamId); await signOut(auth); location.reload(); };
$("#logoutBtn2").onclick = logout;

onAuthStateChanged(auth, async user => {
  unsubs.forEach(u => u()); unsubs = [];
  if (!user) { show("vLogin"); return; }
  const s = await get(ref(db, `teamByUid/${user.uid}`)).catch(() => null);
  teamId = s && s.val();
  if (!teamId) { show("vLogin"); $("#loginErr").innerHTML = b("not_team"); await signOut(auth); return; }
  pid = localStorage.getItem("tc_pid_" + teamId);

  unsubs.push(onValue(ref(db, "teams"), s => { teams = s.val() || {}; renderTeamChip(); render(); }));
  unsubs.push(onValue(ref(db, `players/${teamId}`), s => {
    players = s.val() || {};
    if (pid && !players[pid]) { pid = null; localStorage.removeItem("tc_pid_" + teamId); } // removed by host
    if (!pid) { show("vName"); renderReclaim(); }
    else { if ($("#vMain").classList.contains("hidden")) enterGame(); render(); }
  }));
  unsubs.push(onValue(ref(db, "game"), s => { game = s.val() || {}; onGameChange(); }));
  unsubs.push(onValue(ref(db, "live"), s => { live = s.val(); viewKey = ""; render(); }));
  unsubs.push(onValue(ref(db, "spot"), s => showSpot(s.val())));
  unsubs.push(onValue(ref(db, "ledger"), s => { ledger = s.val() || {}; if (boardOpen) drawBoard(300); render(); }));
  unsubs.push(watchLedger((id, e) => adjustmentToast(e, teams, teamId)));
});

function renderTeamChip() {
  const tm = teams[teamId];
  const chip = $("#teamChip");
  if (!tm) { chip.classList.add("hidden"); return; }
  chip.classList.remove("hidden");
  chip.style.setProperty("--c", tm.color);
  chip.innerHTML = `<span class="dot"></span>${esc(tm.name)}`;
}

// ---------------- real name ----------------
$("#nameForm").onsubmit = async e => {
  e.preventDefault();
  const f = $("#firstName").value, l = $("#lastName").value;
  if (!isRealName(f, l)) { $("#nameErr").innerHTML = b("name_invalid"); return; }
  const name = `${titleCase(f)} ${titleCase(l)}`;
  $("#nameErr").textContent = "";
  try {
    const res = await runTransaction(ref(db, `counters/${teamId}`), c => (c || 0) + 1);
    const number = res.snapshot.val();
    const r = push(ref(db, `players/${teamId}`));
    await set(r, { name, number, joinedAt: serverTimestamp(), online: true });
    pid = r.key;
    localStorage.setItem("tc_pid_" + teamId, pid);
    enterGame();
  } catch (err) { console.error(err); $("#nameErr").innerHTML = b("failed"); }
};

function renderReclaim() {
  const list = Object.entries(players).sort((a, b) => a[1].number - b[1].number);
  $("#reclaim").innerHTML = list.length ? `<p class="muted">${b("already_joined")}</p>
    <div class="chips">${list.map(([id, p]) => `<button class="chip" data-pid="${id}">#${p.number} ${esc(p.name)}</button>`).join("")}</div>` : "";
  $$("#reclaim [data-pid]").forEach(b => b.onclick = () => {
    pid = b.dataset.pid; localStorage.setItem("tc_pid_" + teamId, pid); enterGame();
  });
}

let presenceSet = false;
function enterGame() {
  show("vMain");
  if (!presenceSet) {
    presenceSet = true;
    onValue(ref(db, ".info/connected"), s => {
      if (s.val() !== true || !pid) return;
      const r = ref(db, `players/${teamId}/${pid}/online`);
      onDisconnect(r).set(false).then(() => set(r, true)).catch(() => {});
    });
  }
  viewKey = ""; render();
}

// ---------------- game state ----------------
let lastQid = null;
function onGameChange() {
  if (game.qid !== lastQid) {
    lastQid = game.qid;
    qUnsubs.forEach(u => u()); qUnsubs = [];
    assign = {}; subs = {}; secret = null; selectedChoice = null; pendingImage = null;
    if (game.qid) {
      qUnsubs.push(onValue(ref(db, `assign/${game.qid}/${teamId}`), s => { assign = s.val() || {}; render(); }));
      qUnsubs.push(onValue(ref(db, `submissions/${game.qid}/${teamId}`), s => { subs = s.val() || {}; render(); }));
      if (pid) qUnsubs.push(onValue(ref(db, `secrets/${game.qid}/${teamId}/${pid}`), s => { secret = s.val(); render(); }));
    }
  }
  // scoreboard
  if (game.showBoard && !boardOpen) { boardOpen = true; boardFrom = null; $("#boardOverlay").classList.remove("hidden"); drawBoard(900); }
  else if (!game.showBoard && boardOpen) { boardOpen = false; $("#boardOverlay").classList.add("hidden"); }
  render();
}
function drawBoard(delay) {
  boardFrom = renderBoard($("#board"), { teams, ledger, since: game.boardSince || 0, from: boardFrom, highlight: teamId, delay });
}

const me = () => players[pid];
const isAssigned = () => !!(assign._all || assign[pid]);
const mySub = () => live && (live.inputMode === "team" ? subs.team : subs[pid]);
const timeLeft = () => game.endsAt ? Math.max(0, game.endsAt - serverNow()) : Infinity;
const canAnswer = () => game.phase === "open" && timeLeft() > 0 && isAssigned() && !mySub();

// ---------------- render ----------------
function render() {
  if (!pid || !me() || $("#vMain").classList.contains("hidden")) return;
  const m = me();
  $("#meBar").innerHTML = `<b>#${m.number}</b> · ${esc(m.name)}`;

  const phase = game.phase || "lobby";
  const inQ = phase !== "lobby" && live && live.qid === game.qid;
  const sub = inQ ? mySub() : null;
  const key = inQ
    ? [live.qid, phase, isAssigned(), !!sub, lang(), secret, Object.keys(assign).sort().join(","), game.reveal ? 1 : 0].join("|")
    : ["lobby", lang(), Object.keys(players).length].join("|");
  if (key === viewKey) { tick(); return; }
  viewKey = key;
  const stage = $("#stage");
  if (!inQ) { stage.innerHTML = lobbyHTML(); return; }
  if (phase === "reveal") { stage.innerHTML = revealHTML(); return; }
  stage.innerHTML = questionHTML(phase, sub);
  wireInputs();
  tick();
  clearInterval(timerHandle);
  timerHandle = setInterval(tick, 250);
}

function lobbyHTML() {
  const list = Object.values(players).sort((a, b) => a.number - b.number);
  return `<div class="card center pulse-card"><div class="big-emoji">⏳</div><h2>${b("waiting")}</h2></div>
    <div class="card"><h3 class="row-h"><span>${b("teammates")}</span><span class="count">${list.length}</span></h3>
    <div class="chips">${list.map(p => `<span class="chip ${p.online ? "" : "offline"}">#${p.number} ${esc(p.name)}</span>`).join("")}</div></div>`;
}

function dutyNames() {
  return Object.keys(assign).filter(k => k !== "_all" && players[k])
    .map(k => players[k]).sort((a, b) => a.number - b.number)
    .map(p => `#${p.number} ${esc(p.name)}`).join(", ");
}

function rulesHTML() {
  const q = live;
  const rows = rulesList(q).map(([ic, en, ar]) => `<li><span class="r-ic">${ic}</span><span class="r-tx">${pair(esc(en), esc(ar))}</span></li>`).join("");
  const me = isAssigned()
    ? `<div class="turn-banner">${b("you_play")}</div>`
    : `<div class="card center bench-mini">🪑 ${b("you_bench")} <b>${dutyNames() || "…"}</b></div>`;
  return `<div class="card rules-card">
      <div class="rules-head"><span class="rules-num">${q.num ? "Q" + q.num : ""}</span><h2>${b("next_q")}</h2></div>
      <ul class="rules-list">${rows}</ul>
      <p class="rules-wait">⏳ ${b(q.type === "lineup" && isAssigned() ? "lineup_soon" : "rules_wait")}</p>
    </div>${me}`;
}
function questionHTML(phase, sub) {
  const q = live;
  if (phase === "show" || !q.hasContent && q.hasContent !== undefined) return rulesHTML();
  const head = `<div class="q-card card">
    <div class="q-meta"><span class="q-type">${TYPE_ICON[q.type] || "❓"}</span>${q.practice ? `<span class="tag">${b("practice")}</span>` : ""}
      <div class="timer" id="timer"></div></div>
    <h2 class="q-title">${qb(q, "title")}</h2>
    ${qt(q, "body") ? `<p class="q-body">${qb(q, "body")}</p>` : ""}
    ${q.image ? `<img class="q-img" src="${esc(q.image)}" alt="">` : ""}
    <div class="timebar"><div id="timebarFill"></div></div>
  </div>`;

  if (!isAssigned()) {
    return head + `<div class="card bench"><div class="big-emoji">🪑</div><h3>${b("bench_title")}</h3>
      <p>${b("bench_body", { names: `<b>${dutyNames() || "…"}</b>` })}</p>${teamStatusHTML()}</div>`;
  }
  const intro = q.inputMode === "each" ? `<div class="turn-banner everyone">${b("everyone_turn")}</div>`
    : `<div class="turn-banner">${b("your_turn")}</div>`;
  if (phase === "show") return head + intro + `<div class="card center"><h3>${b("get_ready")}</h3>${q.type === "lineup" ? `<p>${b("lineup_soon")}</p>` : ""}</div>`;
  if (sub) {
    const by = q.inputMode === "team" && sub.playerId !== pid ? b("submitted_by", { name: esc(sub.name) }) : "";
    const txt = q.type === "task" || q.type === "lineup" ? b("done_sent") : b("submitted");
    return head + `<div class="card center done-card"><div class="big-emoji">✅</div><h3>${txt}</h3>
      ${by ? `<p>${by}</p>` : ""}${sub.value && q.type !== "photo" && q.type !== "task" && q.type !== "lineup" ? `<p class="answer-echo">${answerLabel(sub.value)}</p>` : ""}
      ${teamStatusHTML()}</div>` + (q.type === "lineup" && secret != null ? secretHTML() : "");
  }
  return head + intro + `<div class="card answer-card" id="answerCard">${inputHTML(q)}<p class="err" id="ansErr"></p></div>` + teamStatusHTML(true);
}

function answerLabel(v) {
  if (live.type === "choice") { const i = Number(v); return textPair(qOptions(live, "en")[i] ?? v, qOptions(live, "ar")[i]); }
  return esc(v);
}

function teamStatusHTML(asCard) {
  if (!live || live.inputMode !== "each") return "";
  const dutyIds = assign._all ? Object.keys(players) : Object.keys(assign).filter(k => k !== "_all");
  const n = dutyIds.filter(id => subs[id]).length;
  const html = `<p class="squad" id="squad">${b("squad_progress", { n, m: dutyIds.length })}</p>`;
  return asCard ? `<div class="card">${html}</div>` : html;
}

function secretHTML() {
  return `<div class="card center secret"><p>${b("secret_number")}</p><div class="secret-num">${esc(secret)}</div><p class="muted">${b("lineup_hint")}</p></div>`;
}

function inputHTML(q) {
  switch (q.type) {
    case "text":
      return `<input id="ansText" class="ans-input" placeholder="${tp("type_answer")}" autocomplete="off" maxlength="200">
        <button class="btn big" id="ansSend">${b("submit")}</button>`;
    case "number":
      return `<input id="ansText" class="ans-input" type="number" inputmode="decimal" step="any" placeholder="${tp("number_answer")}">
        <button class="btn big" id="ansSend">${b("submit")}</button>`;
    case "choice":
      const arOpts = qOptions(q, "ar");
      return `<div class="choices">${qOptions(q, "en").map((o, i) =>
        `<button class="choice c${i % 6}" data-i="${i}">${textPair(o, arOpts[i])}</button>`).join("")}</div>
        <button class="btn big hidden" id="ansSend">${b("submit")}</button>`;
    case "photo":
      return photoHTML();
    case "task":
      return (q.requirePhoto ? photoHTML(b("were_done")) : `<button class="btn huge" id="ansDone">${b("were_done")}</button>`);
    case "lineup":
      return (secret != null ? `<div class="secret-num">${esc(secret)}</div><p class="muted">${b("lineup_hint")}</p>` : "")
        + `<button class="btn huge" id="ansDone">${b("were_done")}</button>`;
  }
  return "";
}
function photoHTML(label) {
  return `<label class="btn big ghost file-btn">${b("take_photo")}<input id="ansFile" type="file" accept="image/*" hidden></label>
    <img id="ansPreview" class="preview hidden" alt="${tp("photo_preview")}">
    <button class="btn big hidden" id="ansSend">${label || b("send_photo")}</button>`;
}

function wireInputs() {
  const send = $("#ansSend"), done = $("#ansDone"), text = $("#ansText"), file = $("#ansFile");
  if (text) {
    text.addEventListener("keydown", e => { if (e.key === "Enter") send.click(); });
    send.onclick = () => { const v = text.value.trim(); if (v) submit(v); };
  }
  $$(".choice").forEach(b => b.onclick = () => {
    $$(".choice").forEach(x => x.classList.remove("sel"));
    b.classList.add("sel"); selectedChoice = b.dataset.i; send.classList.remove("hidden");
  });
  if (send && live.type === "choice") send.onclick = () => { if (selectedChoice != null) submit(selectedChoice); };
  if (file) file.onchange = async () => {
    const f = file.files[0]; if (!f) return;
    try {
      pendingImage = await compressImage(f);
      $("#ansPreview").src = pendingImage; $("#ansPreview").classList.remove("hidden");
      send.classList.remove("hidden");
    } catch { $("#ansErr").innerHTML = b("failed"); }
  };
  if (file && send) send.onclick = () => { if (pendingImage) submit(live.type === "task" ? "done" : "photo", pendingImage); };
  if (done) done.onclick = () => submit("done");
}

async function submit(value, image) {
  if (!canAnswer()) { $("#ansErr") && ($("#ansErr").innerHTML = b("too_late")); return; }
  const sid = live.inputMode === "team" ? "team" : pid;
  const card = $("#answerCard");
  card && card.classList.add("sending");
  if (image) $("#ansErr").innerHTML = b("uploading");
  const upd = {};
  upd[`submissions/${game.qid}/${teamId}/${sid}`] = {
    playerId: pid, name: me().name, number: me().number, value: String(value), time: serverTimestamp(), hasImage: !!image
  };
  if (image) upd[`images/${game.qid}/${teamId}/${sid}`] = image;
  try { await update(ref(db), upd); if (navigator.vibrate) navigator.vibrate(60); }
  catch (e) {
    console.error(e);
    card && card.classList.remove("sending");
    $("#ansErr") && ($("#ansErr").innerHTML = mySub() ? b("submitted") : (timeLeft() <= 0 ? b("too_late") : b("failed")));
  }
}

function tick() {
  const el = $("#timer"), fill = $("#timebarFill");
  if (!el || !live) return;
  if (game.phase === "locked") { el.innerHTML = b("times_up"); el.classList.add("over"); if (fill) fill.style.width = "0%"; disableInputs(); return; }
  if (!game.endsAt || game.phase !== "open") { el.textContent = game.phase === "show" ? "" : "∞"; if (fill) fill.style.width = game.phase === "open" ? "100%" : "0%"; return; }
  const left = timeLeft();
  const total = (live.timeLimit || 1) * 1000;
  if (left > 0) el.textContent = Math.ceil(left / 1000) + "s"; else if (!el.classList.contains("over")) el.innerHTML = b("times_up");
  el.classList.toggle("over", left <= 0);
  el.classList.toggle("hurry", left > 0 && left < 5000);
  if (fill) fill.style.width = Math.max(0, Math.min(100, (left / total) * 100)) + "%";
  if (left <= 0) disableInputs();
  const sq = $("#squad");
  if (sq && live.inputMode === "each") {
    const dutyIds = assign._all ? Object.keys(players) : Object.keys(assign).filter(k => k !== "_all");
    sq.innerHTML = b("squad_progress", { n: dutyIds.filter(id => subs[id]).length, m: dutyIds.length });
  }
}
function disableInputs() { $$("#answerCard button, #answerCard input").forEach(b => b.disabled = true); }

function revealHTML() {
  const r = game.reveal || {};
  const res = (r.results || {})[teamId];
  const ans = textPair(r.answer_en, r.answer_ar);
  return `<div class="card center reveal-card">
    <h3>${qb(live, "title")}</h3>
    ${ans ? `<p class="muted">${b("answer_was")}</p><div class="reveal-answer">${ans}</div>` : ""}
    ${live.revealImage ? `<div class="reveal-pic"><img src="${esc(live.revealImage)}" alt=""></div>` : ""}
    ${live.practice ? `<p class="tag">${b("practice")}</p>` : res ? `<p class="muted">${b("your_team_got")}</p>
      <div class="reveal-points ${res.points < 0 ? "neg" : ""}">${res.points > 0 ? "+" : ""}${res.points} ${pair(t("points"), "")}</div>
      ${res.summary ? `<p class="muted">${textPair(res.summary, summaryAr(res.summary))}</p>` : ""}` : ""}
  </div>`;
}

// Arabic line for the auto-generated result summary ("✓ canberra · 1st · 4.2s")
function summaryAr(s) {
  return String(s)
    .replace(/no answer/g, "بدون جواب")
    .replace(/(\d+)\/(\d+) answered/g, "جاوب $1 من $2")
    .replace(/(\d+) correct/g, "$1 صح")
    .replace(/−(\d+) wrong/g, "−$1 غلط")
    .replace(/off by ([\d.]+)/g, "الفرق $1")
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "المركز $1")
    .replace(/(\d+(?:\.\d+)?)s\b/g, "$1 ث");
}

// ---------- photo spotlight (host pressed "Show on projector + phones") ----------
let spotDismissed = null;
function showSpot(sp) {
  const ov = $("#spotOverlay");
  if (!sp || !sp.image || spotDismissed === sp.at) { ov.classList.add("hidden"); return; }
  const mine = sp.teamId === teamId;
  $("#spotInner").innerHTML = `
    <div class="spot-title">${textPair(sp.title_en, sp.title_ar)}</div>
    <img class="spot-img" src="${sp.image}" alt="">
    <div class="spot-cap ${mine ? "mine" : ""}" style="--c:${esc(sp.color)}"><span class="dot"></span>${esc(sp.teamName)}${sp.name ? ` · ${esc(sp.name)}` : ""}</div>
    ${mine ? `<div class="spot-mine">${b("your_photo")}</div>` : ""}`;
  ov.classList.remove("hidden");
  if (mine && navigator.vibrate) navigator.vibrate(150);
  $("#spotClose").onclick = () => { spotDismissed = sp.at; ov.classList.add("hidden"); };
}
