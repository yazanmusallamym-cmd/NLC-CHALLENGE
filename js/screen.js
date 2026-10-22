// Projector screen — sign in on host.html in the same browser first.
import {
  auth, db, ref, onValue, get, onAuthStateChanged, serverNow, GAME, checkAdmin, rulesList,
  $, $$, esc, applyBranding, configBanner, qt, qOptions, watchNotices, adjustmentToast, renderBoard, TYPE_ICON
} from "./common.js";
import { checkVersions } from "./common.js";
export const PAGE_VERSION = "2026-10-22";
checkVersions("screen.js", PAGE_VERSION);

applyBranding();
if (configBanner()) throw new Error("Firebase not configured");

let game = {}, live = null, teams = {}, players = {}, board = null, assignQ = {}, subsQ = {}, imagesQ = {};
let qUnsubs = [], imgUnsub = null, imgQid = null, lastQid, viewKey = "", boardOpen = false, boardFrom = null;
const stage = $("#sStage");

$("#fsBtn").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();

onAuthStateChanged(auth, async user => {
  const ok = user && await checkAdmin(user.uid).catch(() => false);
  if (!ok) {
    stage.innerHTML = `<div class="s-center"><h1>📺 Projector screen</h1><p>Sign in on <a href="host.html">host.html</a> in this same browser, then come back to this tab.</p></div>`;
    return;
  }
  onValue(ref(db, "teams"), s => { teams = s.val() || {}; viewKey = ""; render(); });
  onValue(ref(db, "players"), s => { players = s.val() || {}; render(); });
  onValue(ref(db, "live"), s => { live = s.val(); viewKey = ""; render(); });
  onValue(ref(db, "board"), s => { board = s.val(); if (boardOpen) drawBoard(board && boardFrom ? 300 : 1200); });
  onValue(ref(db, "game"), s => { game = s.val() || { phase: "lobby" }; onGame(); });
  watchNotices((id, e) => adjustmentToast(e, teams, null));
  setInterval(tick, 200);
});

function onGame() {
  if (game.qid !== lastQid) {
    lastQid = game.qid;
    qUnsubs.forEach(u => u()); qUnsubs = [];
    assignQ = {}; subsQ = {};
    if (game.qid) {
      qUnsubs.push(onValue(ref(db, `assign/${game.qid}`), s => { assignQ = s.val() || {}; viewKey = ""; render(); }));
      qUnsubs.push(onValue(ref(db, `submissions/${game.qid}`), s => { subsQ = s.val() || {}; render(); }));
    }
  }
  // only download photos when they'll be shown
  const wantQid = game.gallery && game.qid ? game.qid : null;
  if (imgQid !== wantQid) {
    if (imgUnsub) imgUnsub();
    imgUnsub = null; imagesQ = {}; imgQid = wantQid;
    if (wantQid) imgUnsub = onValue(ref(db, `images/${wantQid}`), s => { imagesQ = s.val() || {}; viewKey = ""; render(); });
  }

  if (game.showBoard && !boardOpen) { boardOpen = true; boardFrom = null; $("#sBoard").classList.remove("hidden"); drawBoard(1200); }
  else if (!game.showBoard && boardOpen) { boardOpen = false; $("#sBoard").classList.add("hidden"); }
  viewKey = ""; render();
}
function drawBoard(delay) {
  if (!board) return;
  boardFrom = renderBoard($("#sBoardInner"), { teams, board, from: boardFrom, delay });
}

const teamIds = () => Object.keys(teams).sort((a, b) => (teams[a].name || "").localeCompare(teams[b].name || ""));
const bi = (obj, f) => {
  const en = obj[`${f}_en`] || "", ar = obj[`${f}_ar`] || "";
  return `${en ? `<div class="en">${esc(en)}</div>` : ""}${ar && ar !== en ? `<div class="ar" dir="rtl">${esc(ar)}</div>` : ""}`;
};

// Rebuilds the stage only when the view changes; otherwise just patches live data.
function render() {
  const phase = game.phase || "lobby";
  const inQ = phase !== "lobby" && live && live.qid === game.qid;
  const key = inQ ? `q|${live.qid}|${phase}|${game.gallery ? 1 : 0}|${JSON.stringify(game.spotlight || "")}|${game.reveal ? 1 : 0}` : "lobby";
  if (key === viewKey) { patch(); return; }
  viewKey = key;
  if (!inQ) stage.innerHTML = lobbyHTML(), drawQR();
  else if (game.gallery) stage.innerHTML = galleryHTML();
  else if (phase === "reveal") stage.innerHTML = revealHTML();
  else if (phase === "show" || live.hasContent === false) stage.innerHTML = rulesHTML();
  else stage.innerHTML = questionHTML();
  patch(); tick();
}

// ---------- lobby ----------
function playerUrl() {
  if (GAME.playerUrl) return GAME.playerUrl;
  return location.href.replace(/screen\.html.*$/, "");
}
function lobbyHTML() {
  // Left two-thirds: teams (under the logo). Right third: QR at the top, then title + how to join.
  return `<div class="lobby">
    <div class="lobby-teams" id="lobbyTeams"></div>
    <div class="lobby-side">
      <div class="qr-box"><div id="qr"></div><div class="qr-url">${esc(playerUrl().replace(/^https?:\/\//, ""))}</div></div>
      <h1 class="s-title" data-title>${esc(GAME.title)}</h1>
      <div class="s-sub" dir="rtl">${esc(GAME.titleAr)}</div>
      <p class="s-hint">Scan · sign in with your team login · type your REAL name<br><span dir="rtl">امسح · ادخل بحساب فريقك · اكتب اسمك الحقيقي</span></p>
    </div>
  </div>`;
}
function drawQR() {
  const el = $("#qr");
  if (el && window.QRCode) new QRCode(el, { text: playerUrl(), width: 260, height: 260, colorDark: "#1b1440", colorLight: "#ffffff" });
}
function lobbyTeamsHTML() {
  return teamIds().map(tid => {
    const list = Object.values(players[tid] || {}).sort((a, b) => a.number - b.number);
    return `<div class="lt-card" style="--c:${esc(teams[tid].color)}">
      <div class="lt-head"><span class="dot"></span>${esc(teams[tid].name)}<span class="lt-count">${list.length}</span></div>
      <div class="chips">${list.map(p => `<span class="chip pop ${p.online ? "" : "offline"}">#${p.number} ${esc(p.name)}</span>`).join("")}</div></div>`;
  }).join("");
}

// ---------- rules (before the countdown) ----------
function rulesHTML() {
  const rows = rulesList(live).map(([ic, en, ar]) => `<li><span class="r-ic">${ic}</span><span><span class="en">${esc(en)}</span><span class="ar" dir="rtl">${esc(ar)}</span></span></li>`).join("");
  return `<div class="s-rules">
    <div class="s-rules-head"><span class="rules-num big">${live.num ? "Q" + live.num : ""}</span>
      <div><div class="s-qtitle">Next question<div class="ar" dir="rtl">السؤال الجاي</div></div></div></div>
    <ul class="s-rules-list">${rows}</ul>
    <p class="s-hint">⏳ The question appears when the countdown starts · <span dir="rtl">السؤال رح يظهر لما يبلّش العد التنازلي</span></p>
    <div class="s-teams" id="sTeams"></div>
  </div>`;
}

// ---------- question ----------
function questionHTML() {
  const q = live;
  const opts = q.type === "choice" ? qOptions(q, "en").map((o, i) => {
    const ar = qOptions(q, "ar")[i];
    return `<div class="s-opt c${i % 6}">${esc(o)}${ar && ar !== o ? `<span class="sub-ar" dir="rtl" lang="ar">${esc(ar)}</span>` : ""}</div>`;
  }).join("") : "";
  return `<div class="s-question">
    <div class="s-qhead">
      <span class="s-type">${TYPE_ICON[q.type] || "❓"}</span>
      ${q.practice ? `<span class="tag">Practice · تجربة</span>` : ""}
      ${q.inputMode === "each" ? `<span class="tag hot">EVERYONE ANSWERS · الكل يجاوب</span>` : ""}
    </div>
    <div class="s-qtitle">${bi(q, "title")}</div>
    <div class="s-qbody">${bi(q, "body")}</div>
    ${q.image ? `<img class="s-qimg" src="${esc(q.image)}" alt="">` : ""}
    ${opts ? `<div class="s-opts">${opts}</div>` : ""}
    <div class="s-timer" id="sTimer"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring" id="ring"/></svg><span id="sTimerTxt"></span></div>
    <div class="s-teams" id="sTeams"></div>
  </div>`;
}
function teamsStatusHTML() {
  const q = live;
  const order = [];
  for (const tid of teamIds()) {
    const s = subsQ[tid] || {};
    const times = Object.values(s).map(e => e.time || 0);
    const a = assignQ[tid] || {}, tp = players[tid] || {};
    const duty = a._all ? Object.keys(tp) : Object.keys(a).filter(k => k !== "_all");
    const done = q.inputMode === "team" ? !!s.team : duty.length > 0 && duty.every(p => s[p]);
    if (done) order.push([tid, Math.max(...times)]);
  }
  order.sort((x, y) => x[1] - y[1]);
  const place = Object.fromEntries(order.map(([tid], i) => [tid, i + 1]));
  return teamIds().map(tid => {
    const s = subsQ[tid] || {}, a = assignQ[tid] || {}, tp = players[tid] || {};
    const duty = a._all ? Object.keys(tp) : Object.keys(a).filter(k => k !== "_all");
    const showNames = !a._all && duty.length <= 4;
    const n = q.inputMode === "team" ? (s.team ? 1 : 0) : duty.filter(p => s[p]).length;
    const m = q.inputMode === "team" ? 1 : duty.length;
    return `<div class="st-card ${place[tid] ? "done" : ""}" style="--c:${esc(teams[tid].color)}">
      <div class="st-head"><span class="dot"></span>${esc(teams[tid].name)}${place[tid] ? `<span class="st-place">✓ ${place[tid]}</span>` : ""}</div>
      ${showNames ? `<div class="st-names">${duty.filter(p => tp[p]).map(p => `<span class="${s[p] || (s.team && s.team.playerId === p) ? "ok" : ""}">#${tp[p].number} ${esc(tp[p].name)}</span>`).join("")}</div>` : ""}
      ${q.inputMode === "each" ? `<div class="st-prog"><div style="width:${m ? (n / m) * 100 : 0}%"></div></div><div class="st-count">${n}/${m}</div>` : ""}
    </div>`;
  }).join("");
}

function tick() {
  const txt = $("#sTimerTxt"), ring = $("#ring");
  if (!txt) return;
  const C = 2 * Math.PI * 52;
  ring.style.strokeDasharray = C;
  if (game.phase === "show") { txt.textContent = "⏳"; ring.style.strokeDashoffset = 0; return; }
  if (game.phase === "locked") { txt.textContent = "⏹"; ring.style.strokeDashoffset = C; $("#sTimer").classList.add("over"); return; }
  if (!game.endsAt) { txt.textContent = "∞"; ring.style.strokeDashoffset = 0; return; }
  const left = Math.max(0, game.endsAt - serverNow()), total = (live.timeLimit || 1) * 1000;
  txt.textContent = Math.ceil(left / 1000);
  ring.style.strokeDashoffset = C * (1 - Math.min(1, left / total));
  $("#sTimer").classList.toggle("hurry", left > 0 && left < 5000);
  $("#sTimer").classList.toggle("over", left <= 0);
}

function patch() {
  const lt = $("#lobbyTeams"); if (lt) lt.innerHTML = lobbyTeamsHTML();
  const st = $("#sTeams"); if (st) st.innerHTML = teamsStatusHTML();
}

// ---------- reveal ----------
function revealHTML() {
  const r = game.reveal || {};
  const res = r.results || {};
  const ans = [r.answer_en, r.answer_ar && r.answer_ar !== r.answer_en ? r.answer_ar : ""].filter(Boolean);
  return `<div class="s-reveal">
    <div class="s-qtitle small">${bi(live, "title")}</div>
    ${live.revealImage ? `<div class="s-reveal-wrap"><div class="reveal-pic big"><img src="${esc(live.revealImage)}" alt=""></div><div>` : "<div>"}
    ${ans.length ? `<div class="s-answer">${ans.map(a => `<div>${esc(a)}</div>`).join("")}</div>` : ""}
    ${live.revealImage ? "</div></div>" : "</div>"}
    <div class="s-results">${teamIds().sort((a, b) => ((res[a] || {}).order ?? 99) - ((res[b] || {}).order ?? 99)).map(tid => {
      const x = res[tid] || { summary: "" };
      return `<div class="sr-row" style="--c:${esc(teams[tid].color)}"><span class="dot"></span><b>${esc(teams[tid].name)}</b>
        <span class="sr-sum">${esc(x.summary || "—")}</span></div>`;
    }).join("")}</div>
    <p class="s-hint">🏆 Points stay secret until the scoreboard · <span dir="rtl">النقاط سرّية لحد ما تظهر النتائج</span></p></div>`;
}

// ---------- photos ----------
function galleryHTML() {
  const sp = game.spotlight;
  if (sp && imagesQ[sp.teamId] && imagesQ[sp.teamId][sp.sid]) {
    const s = (subsQ[sp.teamId] || {})[sp.sid] || {};
    return `<div class="s-spot"><img src="${imagesQ[sp.teamId][sp.sid]}" alt="">
      <div class="s-spot-cap" style="--c:${esc(teams[sp.teamId]?.color)}"><span class="dot"></span>${esc(teams[sp.teamId]?.name || "")}${s.name ? ` · ${esc(s.name)}` : ""}</div></div>`;
  }
  const items = [];
  for (const tid of teamIds()) for (const [sid, src] of Object.entries(imagesQ[tid] || {})) {
    const s = (subsQ[tid] || {})[sid] || {};
    items.push(`<figure style="--c:${esc(teams[tid].color)}"><img src="${src}" alt=""><figcaption><span class="dot"></span>${esc(teams[tid].name)}${s.name ? ` · ${esc(s.name)}` : ""}</figcaption></figure>`);
  }
  return `<div class="s-gallery-wrap"><div class="s-qtitle small">${bi(live, "title")}</div>
    <div class="s-gallery">${items.join("") || `<p class="s-hint">Photos will appear here…</p>`}</div></div>`;
}
