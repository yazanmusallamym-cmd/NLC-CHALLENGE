// Shared setup: Firebase, language, helpers, scoreboard.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  browserLocalPersistence, setPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, onValue, get, set, update, push, remove,
  runTransaction, serverTimestamp, onDisconnect, off
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, GAME } from "./config.js";

export const configured = !String(firebaseConfig.apiKey).startsWith("PASTE");
// Players get their own sign-in slot, so a team login and the host login can live in the same browser.
const IS_PLAYER = !/(host|screen)\.html$/i.test(location.pathname);
export const app = IS_PLAYER ? initializeApp(firebaseConfig, "player") : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
  ref, onValue, get, set, update, push, remove, runTransaction, serverTimestamp,
  onDisconnect, off, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  GAME, firebaseConfig
};

// ---------- server clock ----------
let offset = 0;
onValue(ref(db, ".info/serverTimeOffset"), s => { offset = s.val() || 0; });
export const serverNow = () => Date.now() + offset;

// ---------- small helpers ----------
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const uid8 = () => Math.random().toString(36).slice(2, 10);

let brandSettings = {};
export function applyBranding() {
  const setLogo = src => $$("[data-logo]").forEach(el => {
    el.classList.remove("logo-missing");
    el.onerror = () => el.classList.add("logo-missing");
    el.src = src;
  });
  const setBg = url => document.body.style.setProperty("--bg-image", url ? `url("${url}")` : "none");
  const fileBg = () => { const img = new Image(); img.onload = () => !brandSettings.background && setBg(GAME.background); img.src = GAME.background; };
  setLogo(GAME.logo); fileBg();
  setTitles();
  // Look & feel chosen in the host panel overrides the files, live for everyone.
  if (!configured) return;
  onValue(ref(db, "settings"), snap => {
    brandSettings = snap.val() || {};
    const st = document.body.style;
    if (brandSettings.background) setBg(brandSettings.background); else { setBg(null); fileBg(); }
    setLogo(brandSettings.logo || GAME.logo);
    if (brandSettings.brand) st.setProperty("--brand", brandSettings.brand); else st.removeProperty("--brand");
    st.setProperty("--overlay", brandSettings.overlay ?? 0.6);
    st.setProperty("--blobs", brandSettings.background ? "0" : "1");
  }, () => {});
}

export function configBanner() {
  if (configured) return false;
  document.body.insertAdjacentHTML("afterbegin",
    `<div class="setup-banner">Firebase isn't set up yet — open <b>js/config.js</b> and paste your Firebase config (see README).</div>`);
  return true;
}

// ---------- language ----------
const T = {
  en: {
    login_title: "Team sign in", email: "Team email", password: "Team password", sign_in: "Sign in",
    sign_out: "Sign out", wrong_login: "Wrong email or password", not_team: "This account isn't linked to a team.",
    who_are_you: "Who are you?", real_name_hint: "Use your real first and last name — the host can see it.",
    first_name: "First name", last_name: "Last name", join: "Join my team", name_invalid: "Please type your real first and last name (letters only).",
    already_joined: "Already joined on another phone? Tap your name:", not_me: "Not you?",
    you_are: "You are", player: "Player", waiting: "You're in! Waiting for the host…", teammates: "Your team",
    get_ready: "Get ready…", time_left: "left", times_up: "Time's up!",
    your_turn: "Your turn!", bench_title: "This one isn't yours", bench_body: "It's for {names}. Help them think — but only they can answer on their phone.",
    everyone_turn: "Everyone answers this one — your team needs YOU.",
    submit: "Submit", submitted: "Submitted ✓", submitted_by: "Answered by {name}", type_answer: "Type your answer…",
    number_answer: "Your number…", take_photo: "📷 Take / choose a photo", send_photo: "Send photo", photo_preview: "Preview",
    were_done: "WE'RE DONE!", done_sent: "Done sent ✓ — the host will check it", secret_number: "Your secret number",
    lineup_hint: "Line up in order without saying your number out loud!", squad_progress: "{n}/{m} of your squad answered",
    answer_was: "The answer", your_team_got: "Your team got", points: "pts", practice: "Practice round — no points",
    scoreboard: "Scoreboard", recent: "Latest adjustments", uploading: "Uploading…", failed: "Couldn't send — try again",
    too_late: "Too late, time is up", your_photo: "📸 That's your team on the big screen!", lineup_soon: "Your secret number appears when the timer starts — get ready to line up!", next_q: "Next question", rules_wait: "The question appears when the countdown starts", you_play: "You're playing this one!", you_bench: "You're on the bench for this one — help:", confirm_choice: "Lock in this answer?", on_duty: "On duty", lobby: "Lobby"
  },
  ar: {
    login_title: "دخول الفريق", email: "بريد الفريق", password: "كلمة سر الفريق", sign_in: "دخول",
    sign_out: "خروج", wrong_login: "البريد أو كلمة السر غير صحيحة", not_team: "هذا الحساب غير مرتبط بفريق.",
    who_are_you: "مين أنت؟", real_name_hint: "اكتب اسمك الحقيقي الأول والأخير — المشرف يشوفه.",
    first_name: "الاسم الأول", last_name: "اسم العائلة", join: "انضم لفريقي", name_invalid: "اكتب اسمك الحقيقي الأول والأخير (حروف فقط).",
    already_joined: "دخلت من جوال ثاني؟ اضغط على اسمك:", not_me: "مش أنت؟",
    you_are: "أنت", player: "لاعب", waiting: "تم! بانتظار المشرف…", teammates: "فريقك",
    get_ready: "استعدوا…", time_left: "متبقي", times_up: "انتهى الوقت!",
    your_turn: "دورك!", bench_title: "هذا السؤال مش إلك", bench_body: "السؤال لـ {names}. ساعدهم بالتفكير — بس هم بس بيجاوبوا من جوالهم.",
    everyone_turn: "الكل بيجاوب على هذا — فريقك بحاجتك.",
    submit: "إرسال", submitted: "تم الإرسال ✓", submitted_by: "جاوب {name}", type_answer: "اكتب جوابك…",
    number_answer: "رقمك…", take_photo: "📷 صوّر / اختر صورة", send_photo: "أرسل الصورة", photo_preview: "معاينة",
    were_done: "خلصنا!", done_sent: "تم ✓ — المشرف رح يتأكد", secret_number: "رقمك السري",
    lineup_hint: "رتبوا حالكم بالترتيب بدون ما تقول رقمك بصوت عالي!", squad_progress: "{n}/{m} من فريقك جاوبوا",
    answer_was: "الجواب", your_team_got: "فريقك أخذ", points: "نقطة", practice: "جولة تجريبية — بدون نقاط",
    scoreboard: "النتائج", recent: "آخر التعديلات", uploading: "جاري الرفع…", failed: "ما انبعث — جرب مرة ثانية",
    too_late: "متأخر، الوقت خلص", your_photo: "📸 هاي صورة فريقكم على الشاشة!", lineup_soon: "رقمك السري رح يظهر لما يبلّش الوقت — استعدوا للترتيب!", next_q: "السؤال الجاي", rules_wait: "السؤال رح يظهر لما يبلّش العد التنازلي", you_play: "إنت بتلعب هالسؤال!", you_bench: "إنت احتياط بهالسؤال — ساعد:", confirm_choice: "تثبيت هذا الجواب؟", on_duty: "المكلّفون", lobby: "الانتظار"
  }
};
export const lang = () => localStorage.getItem("tc_lang") || "en";
export function setLang(l) { localStorage.setItem("tc_lang", l); applyLang(); }
export function tl(l, key, vars = {}) {
  let s = (T[l] && T[l][key]) || T.en[key] || key;
  for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}
export const t = (key, vars) => tl(lang(), key, vars);

// ---- Bilingual: English with a smaller Arabic line underneath (the default).
// The ع button switches a phone to Arabic only.
export const bilingual = () => lang() !== "ar";
const AR = html => `<span class="sub-ar" dir="rtl" lang="ar">${html}</span>`;
// Two already-safe HTML strings → "English + Arabic under it"
export function pair(enHtml, arHtml) {
  if (!bilingual()) return arHtml || enHtml || "";
  if (!enHtml || !arHtml || enHtml === arHtml) return enHtml || arHtml || "";
  return `${enHtml}${AR(arHtml)}`;
}
// Interface text by key (HTML)
export const b = (key, vars = {}) => pair(tl("en", key, vars), tl("ar", key, vars));
// Interface text for places that can't hold two lines (placeholders)
export const tp = (key, vars = {}) => bilingual() ? `${tl("en", key, vars)} / ${tl("ar", key, vars)}` : tl("ar", key, vars);
// Plain text pair (escaped) — for question fields, options, answers
const nl = s => esc(s).replace(/\n/g, "<br>");
export const textPair = (en, ar) => pair(en ? nl(en) : "", ar ? nl(ar) : "");
export const qb = (obj, field) => obj ? textPair(obj[`${field}_en`], obj[`${field}_ar`]) : "";

function setTitles() {
  $$("[data-title]").forEach(el => {
    if (document.body.classList.contains("phone")) el.innerHTML = textPair(GAME.title, GAME.titleAr);
    else el.textContent = lang() === "ar" ? GAME.titleAr : GAME.title;
  });
}
export function applyLang() {
  document.documentElement.lang = lang();
  document.documentElement.dir = lang() === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(el => el.innerHTML = b(el.dataset.i18n));
  $$("[data-i18n-ph]").forEach(el => el.placeholder = tp(el.dataset.i18nPh));
  setTitles();
}
// Pick the right language field of a question, falling back to the other one.
export function qt(obj, field, l = lang()) {
  if (!obj) return "";
  const other = l === "ar" ? "en" : "ar";
  return obj[`${field}_${l}`] || obj[`${field}_${other}`] || "";
}
export function qOptions(q, l = lang()) {
  const a = (q && q[`options_${l}`]) || [];
  const b = (q && q[`options_${l === "ar" ? "en" : "ar"}`]) || [];
  const n = Math.max(a.length, b.length);
  return Array.from({ length: n }, (_, i) => a[i] || b[i] || "");
}

// ---------- names ----------
export function cleanName(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}
export function isRealName(first, last) {
  const ok = s => /^[\p{L}][\p{L}'\- ]{1,29}$/u.test(cleanName(s));
  const bad = /^(test|player|user|admin|asdf|qwer|aaa+|xxx+|me|no|name)$/i;
  return ok(first) && ok(last) && !bad.test(cleanName(first)) && !bad.test(cleanName(last));
}
export const titleCase = s => cleanName(s).split(" ").map(w => w.charAt(0).toLocaleUpperCase() + w.slice(1)).join(" ");

// ---------- images ----------
export function compressImage(file, maxDim = 1024, quality = 0.7, type = "image/jpeg", maxLen = 600000) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let q = quality, data = c.toDataURL(type, q);
      while (type === "image/jpeg" && data.length > maxLen && q > 0.3) { q -= 0.1; data = c.toDataURL(type, q); }
      resolve(data);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ---------- toasts ----------
export function toast(html, kind = "info", ms = 4500) {
  let box = $("#toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.innerHTML = html;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 400); }, ms);
}

// Calls cb(entryId, entry) for ledger entries added after the page loaded.
export function watchLedger(cb) {
  let seen = null;
  return onValue(ref(db, "ledger"), snap => {
    const all = snap.val() || {};
    if (seen === null) { seen = new Set(Object.keys(all)); return; }
    for (const id of Object.keys(all)) if (!seen.has(id)) { seen.add(id); cb(id, all[id]); }
  });
}

export function adjustmentToast(e, teams, myTeam) {
  if (!e || e.kind === "round") return;
  const team = teams[e.teamId];
  if (!team) return;
  const sign = e.delta > 0 ? "+" : "";
  const mine = myTeam && e.teamId === myTeam;
  toast(`<span class="dot" style="background:${esc(team.color)}"></span><b>${esc(team.name)}</b> <span class="big-delta">${sign}${e.delta}</span><div class="toast-reason">${esc(e.reason || "")}</div>`,
    e.delta < 0 ? "bad" : "good", mine ? 7000 : 4500);
  if (mine && navigator.vibrate) navigator.vibrate(e.delta < 0 ? [200, 80, 200] : 120);
}

// ---------- scores ----------
export function totals(ledger, teamIds, until = Infinity) {
  const out = Object.fromEntries(teamIds.map(id => [id, 0]));
  for (const e of Object.values(ledger || {})) {
    if (out[e.teamId] === undefined) continue;
    if ((e.time || 0) > until) continue;
    out[e.teamId] += Number(e.delta) || 0;
  }
  return out;
}
const rankMap = (order, vals) => {
  const r = {}; let last = null, rank = 0;
  order.forEach((id, i) => { if (vals[id] !== last) { rank = i + 1; last = vals[id]; } r[id] = rank; });
  return r;
};

// Animated scoreboard. `from` = totals to start the animation from (or null to use totals at `since`).
// Returns the totals it ended on, so the caller can animate from there next time.
export function renderBoard(el, { teams, ledger, since = 0, from = null, highlight = null, delay = 900 }) {
  const ids = Object.keys(teams || {});
  if (!ids.length) { el.innerHTML = ""; return {}; }
  const now = totals(ledger, ids);
  const base = totals(ledger, ids, since);
  const start = from ? Object.fromEntries(ids.map(id => [id, from[id] ?? base[id]])) : base;
  const byName = (a, b) => (teams[a].name || "").localeCompare(teams[b].name || "");
  const startOrder = [...ids].sort((a, b) => start[b] - start[a] || byName(a, b));
  const endOrder = [...ids].sort((a, b) => now[b] - now[a] || byName(a, b));
  const startRank = rankMap(startOrder, start), endRank = rankMap(endOrder, now);
  const baseRank = rankMap([...ids].sort((a, b) => base[b] - base[a] || byName(a, b)), base);
  const maxV = Math.max(1, ...ids.map(id => Math.max(now[id], start[id])));
  const pct = v => Math.max(3, Math.round((Math.max(0, v) / maxV) * 100));

  const feed = Object.values(ledger || {})
    .filter(e => e.kind !== "round" && (e.time || 0) > since && teams[e.teamId])
    .sort((a, b) => b.time - a.time).slice(0, 5);

  el.innerHTML = `
    <div class="board">
      ${startOrder.map(id => `
        <div class="brow ${highlight === id ? "mine" : ""}" data-id="${id}" style="--c:${esc(teams[id].color)}">
          <div class="brank">${startRank[id]}</div>
          <div class="bname"><span class="dot"></span>${esc(teams[id].name)}<span class="bmove"></span></div>
          <div class="bbar"><div class="bfill" style="width:${pct(start[id])}%"></div></div>
          <div class="bscore"><span class="num">${start[id]}</span><span class="bdelta"></span></div>
        </div>`).join("")}
    </div>
    ${feed.length ? `<div class="bfeed"><div class="bfeed-title">${b("recent")}</div>${feed.map(e => `
      <div class="bfeed-row ${e.delta < 0 ? "neg" : "pos"}"><span class="dot" style="background:${esc(teams[e.teamId].color)}"></span>
      <b>${esc(teams[e.teamId].name)}</b> <span class="d">${e.delta > 0 ? "+" : ""}${e.delta}</span> <span class="r">${esc(e.reason || "")}</span></div>`).join("")}</div>` : ""}`;

  const boardEl = el.querySelector(".board");
  setTimeout(() => {
    if (!boardEl.isConnected) return;
    const rows = Object.fromEntries([...boardEl.children].map(r => [r.dataset.id, r]));
    const first = Object.fromEntries(ids.map(id => [id, rows[id].getBoundingClientRect().top]));
    endOrder.forEach(id => boardEl.appendChild(rows[id]));
    ids.forEach(id => {
      const r = rows[id];
      const dy = first[id] - r.getBoundingClientRect().top;
      r.style.transition = "none";
      r.style.transform = `translateY(${dy}px)`;
    });
    void boardEl.offsetHeight;
    ids.forEach(id => {
      const r = rows[id];
      r.style.transition = "";
      r.style.transform = "";
      r.querySelector(".bfill").style.width = pct(now[id]) + "%";
      r.querySelector(".brank").textContent = endRank[id];
      const d = now[id] - base[id];
      const bd = r.querySelector(".bdelta");
      if (d) { bd.textContent = (d > 0 ? "+" : "") + d; bd.className = "bdelta show " + (d > 0 ? "pos" : "neg"); }
      const mv = baseRank[id] - endRank[id];
      const m = r.querySelector(".bmove");
      if (mv > 0) { m.textContent = "▲" + mv; m.className = "bmove up"; }
      else if (mv < 0) { m.textContent = "▼" + (-mv); m.className = "bmove down"; }
      countUp(r.querySelector(".num"), start[id], now[id]);
    });
  }, delay);
  return now;
}
function countUp(el, a, b, ms = 1200) {
  if (a === b) { el.textContent = b; return; }
  const t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(a + (b - a) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Plain-language reason for a failed sign-in (null = ordinary wrong email/password).
export function authProblem(err) {
  const c = (err && err.code) || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(c)) return null;
  if (c.includes("operation-not-allowed")) return "Email/Password sign-in is turned off. Firebase → Authentication → Sign-in method → Email/Password → Enable.";
  if (c.includes("unauthorized-domain")) return `This website isn't allowed yet. Firebase → Authentication → Settings → Authorized domains → add ${location.hostname}`;
  if (c.includes("network-request-failed")) return "No connection to Firebase — check the internet and try again.";
  if (c.includes("too-many-requests")) return "Too many attempts — wait a few minutes, or reset the password in Firebase → Authentication → Users.";
  if (c.includes("api-key") || c.includes("invalid-api-key")) return "The Firebase settings in js/config.js are wrong (API key).";
  if (c.includes("user-disabled")) return "This account is disabled in Firebase → Authentication → Users.";
  return "Sign-in failed: " + (c || (err && err.message) || "unknown error");
}

// Is this user a host? Returns true/false, or throws a readable Error if the database can't be read.
export async function checkAdmin(uid) {
  let snap;
  try { snap = await get(ref(db, `admins/${uid}`)); }
  catch (e) {
    const msg = String(e && (e.code || e.message) || e);
    throw new Error(/permission/i.test(msg)
      ? "The database refused access. Make sure you published database.rules.json in Realtime Database → Rules (not Firestore)."
      : "Can't reach the database — check databaseURL in js/config.js. (" + msg + ")");
  }
  const v = snap.val();
  return v === true || v === "true" || v === 1;
}

// The rules of a question, as [icon, English, Arabic] rows — shown before the question itself is revealed.
const AR_NUM = n => String(n); // regular digits: Arabic-Indic zero looks like a dot in GE Dinar
export function rulesList(q) {
  if (!q) return [];
  const rows = [];
  const type = {
    text: ["✍️", "Type your answer", "اكتبوا الجواب"],
    number: ["🎯", "Type a number", "اكتبوا رقم"],
    choice: ["🔘", "Pick one of the options", "اختاروا جواب من الخيارات"],
    photo: ["📸", "Send a photo", "أرسلوا صورة"],
    task: q.requirePhoto ? ["🏃", "Do the task, then send a photo as proof", "نفّذوا المهمة وأرسلوا صورة كإثبات"]
                         : ["🏃", "Do the task, then press “We're done”", "نفّذوا المهمة واضغطوا «خلصنا»"],
    lineup: ["🔢", "Silent line-up — everyone gets a secret number", "ترتيب صامت — كل واحد بياخد رقم سري"]
  }[q.type];
  if (type) rows.push(type);
  if (q.type !== "lineup") rows.push(q.inputMode === "each"
    ? ["👥", "Every player on duty answers on their own phone", "كل لاعب مكلّف بيجاوب من جواله"]
    : ["☝️", "One answer per team — the first one counts", "جواب واحد لكل فريق — أول جواب بينحسب"]);
  const tgt = q.target || "all";
  if (tgt === "rotate") { const n = Math.max(1, Number(q.groupSize) || 1); rows.push(["🔄", `${n} player${n > 1 ? "s" : ""} from each team`, `${AR_NUM(n)} من كل فريق`]); }
  else if (tgt === "numbers") rows.push(["🎯", `Face-off: player #${q.numbers} of every team`, `مواجهة: اللاعب رقم ${AR_NUM(q.numbers || "")} من كل فريق`]);
  else rows.push(["🙌", "The whole team plays", "كل الفريق بيلعب"]);
  rows.push(q.timeLimit ? ["⏱️", `${q.timeLimit} seconds`, `${AR_NUM(q.timeLimit)} ثانية`] : ["⏱️", "No time limit", "بدون وقت"]);
  if (q.practice) rows.push(["🧪", "Practice round — no points", "جولة تجريبية — بدون نقاط"]);
  else {
    const pts = String(q.points || "").split(/[,\s]+/).filter(Boolean);
    const sc = {
      speed: ["⚡", "Fastest correct answer wins", "الأسرع بالجواب الصح بيربح"],
      closest: ["📏", "Closest answer wins", "الأقرب للجواب بيربح"],
      correct: ["✅", "Every correct answer scores", "كل جواب صح بياخد نقاط"],
      participation: ["🤝", "Points for everyone who takes part", "نقاط على قدّ المشاركين"],
      manual: ["⚖️", "The host judges the answers", "المشرف بيحكم على الأجوبة"]
    }[q.scoring || "speed"];
    if (sc) rows.push(sc);
    if (pts.length) rows.push(["🏆", pts.length > 1 ? `Points: ${pts.join(" / ")}` : `${pts[0]} points`, pts.length > 1 ? `النقاط: ${pts.map(AR_NUM).join(" / ")}` : `${AR_NUM(pts[0])} نقطة`]);
    if (Number(q.wrongPenalty)) rows.push(["⚠️", `−${q.wrongPenalty} for a wrong answer`, `−${AR_NUM(q.wrongPenalty)} للجواب الغلط`]);
  }
  return rows;
}

export const TYPE_ICON = { text: "✍️", number: "🎯", choice: "🔘", photo: "📸", task: "🏃", lineup: "🔢" };
