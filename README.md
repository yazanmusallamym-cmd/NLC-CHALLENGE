# Team Challenge — a Mentimeter-style team game where EVERYONE plays

Three pages, all free to host:

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Players (phones) | Team login → real name → automatic player number. Answers by text, number, multiple choice, photo, “We're done” button or secret line-up number. Shows the scoreboard and point deductions live. English / Arabic switch. |
| `host.html` | You (laptop / tablet) | Write questions, create teams, run the game, grade, deduct points, show/hide the scoreboard. |
| `screen.html` | Projector | Lobby with QR code and live list of who joined, the question with a big timer, which players are on duty, who finished first, reveal, photo gallery, animated scoreboard. |

Hosting is **GitHub Pages** (the website) + **Firebase free “Spark” plan** (live data + logins). No credit card needed.
Photos are shrunk on the phone (~100–300 KB) and stored in the database, so you don't need Firebase Storage (which now requires a paid plan).

---

## Step-by-step setup (about 20 minutes, once)

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** → give it a name → you can turn Google Analytics off → **Create**.
2. Left menu **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save**.
3. Left menu **Build → Realtime Database → Create database** → pick the location closest to you (e.g. `europe-west1` for Jordan) → **Start in locked mode** → Enable.
4. In Realtime Database open the **Rules** tab, delete everything, paste the whole contents of `database.rules.json`, then **Publish**.

### 2. Create your host (moderator) login
1. **Authentication → Users → Add user** → your email + a strong password.
2. Copy the **User UID** shown in the list.
3. **Realtime Database → Data** tab → hover the top node → **+** → Key: `admins` → click **+** next to it → Key: *paste your UID*, Value: `true` (choose type boolean if asked) → **Add**.
   You can add more hosts the same way (a co-moderator on another laptop).

### 3. Connect the website to Firebase
1. **Project settings** (gear icon) → **General** → **Your apps** → click the **`</>`** (Web) icon → name it → **Register app**.
2. Copy the `firebaseConfig = { … }` values into **`js/config.js`** (replace the placeholders). Make sure `databaseURL` is there — if it's missing, copy it from the top of the Realtime Database page.
3. In `js/config.js` set your game `title` / `titleAr`.

### 4. Put it on GitHub Pages
1. Create a free account at <https://github.com> → **New repository** → name it e.g. `camp-challenge` → **Public** → Create.
2. **Add file → Upload files** → drag in everything from this folder (keep the `css`, `js`, `assets` folders) → **Commit changes**.
3. Repository **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save. After a minute your site is at
   `https://YOUR-USERNAME.github.io/camp-challenge/`
4. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain** → `YOUR-USERNAME.github.io`.

Your links:
- Players: `https://YOUR-USERNAME.github.io/camp-challenge/`
- Host: `…/camp-challenge/host.html`
- Projector: `…/camp-challenge/screen.html` (open it in the **same browser** where you signed in to host.html)

### 5. Your logo, background and colors (change them any time)
The easiest way: **Host → Teams & look → 🎨 Look & feel**.
- **Upload background** — any photo or design. Every phone and the projector switch to it instantly; upload a different one whenever you like (a new one per event, per day, per round…), or press **Use default**.
- **Upload logo** — transparent PNG works best. It shows on every phone, the host panel and the projector corner.
- **Accent color** — buttons, titles and highlights.
- **Background darkness** — slide toward 0 to show your background clearly, up to make text easier to read.

Prefer files? Put `assets/background.jpg` and `assets/logo.png` in the repo instead — anything set in Look & feel takes priority over the files. Deeper color changes are at the top of `css/style.css`.

---

## Before the event
1. **Host → Teams**: create each team with a name, color, login email and password. The email can be made-up (`falcons@camp.game`) — it's just the team's username.
2. Print or write each team's email + password on a card.
3. **Host → Questions**: press **Load samples** to see one of every type, then edit or add your own. Every question has an English and Arabic title (fill one or both).
4. Do a test run with 2–3 phones.

## Running the game
1. Put `screen.html` on the projector (press ⛶ for full screen). Players scan the QR, sign in with the team login, type their **real first + last name**. Each gets a number inside their team (#1, #2…). Their names pop up on the projector — that social pressure is what stops fake aliases. You can rename or remove anyone from **Teams**.
2. In **Live**, click a question in the run order, then:
   - **👁 Show question** → it appears on phones and projector, inputs locked (time to explain), then **▶ Start timer**; or
   - **🚀 Show & start** → straight away.
3. Watch answers arrive. Use **+15s** or **⏹ Lock** (it auto-locks when time runs out).
4. **🧮 Grade** → the app proposes points; change any number you like → **✅ Apply points** (or **Apply & reveal**).
5. **✨ Reveal** shows the answer and each team's points on phones and projector. For photo rounds use **🖼 Photos on screen**, or click a photo and **Show this on the projector** to spotlight it.
6. **🏆 Show scoreboard** whenever you want the drama: bars grow, teams swap places, and each team sees “+50” / “−20” and arrows for how they moved **since the last time you showed it**. Hide it to continue.
7. Deductions/bonuses: right column of **Live** — type a reason (or pick one), tap −20 … +20 or type any number. The team sees it instantly on every phone (with a buzz) and on the projector, and the reason is listed under the scoreboard. Undo any change in **Scores**.

---

## Question options (all mix and match)

**Answer type**
- ✍️ **Text** — accepted answers separated by `|`, e.g. `Canberra|كانبرا`. Capitals, Arabic hamza/taa-marbuta forms and one typo are forgiven.
- 🎯 **Number** — for estimates and “closest wins”. Arabic digits work.
- 🔘 **Multiple choice** — one option per line; correct answer = option number (1 = first).
- 📸 **Photo** — camera or gallery; you judge them.
- 🏃 **Physical task** — a big “WE'RE DONE!” button (optionally with photo proof). Ranked by who pressed first; you verify.
- 🔢 **Line-up** — every on-duty player secretly gets a number on their phone; the team lines up in order without talking and presses Done. Perfect tutorial round.

**Who submits**
- **One answer per team** — the first submission from any on-duty player counts (one try!).
- **EVERY on-duty player** — each person answers on their own phone. Nobody can hide behind the loud ones.

**Who plays this one** (this is the “everyone plays” engine)
- **Whole team**
- **Auto-rotate N** — picks the N players per team who have had the fewest turns (and are online). Run a few of these and every single person gets their turn. The **Turns** column in **Teams** shows who hasn't played yet (highlighted).
- **Specific numbers** — e.g. `5` → Player #5 of every team faces off; next question `8`… If a team is smaller, it wraps around.
  Players who aren't on duty see “This one is for #5 Sara Haddad — help them think, but only they can answer.”

**Scoring**
- **Fastest correct** — points by rank, e.g. `100,70,50,30` (1st, 2nd, 3rd, 4th; the rest 0). In “every player” mode the team's time is when its **last** player answers — the team is only as fast as its slowest member.
- **Closest number** — ranked by distance from the answer.
- **Everyone correct** — every correct team gets the first number (scaled by % correct in “every player” mode).
- **Participation** — first number × % of on-duty players who answered.
- **Manual** — you type points (photos, creativity, performances).
- **Deduct for a wrong answer** — e.g. 10 → guessing costs points.
- **Practice round** — nothing counts.

The proposed points are always just a suggestion — you can change any team's number before applying.

---

## Ideas to make it more engaging (recommended)

**Structure the night**
1. **Tutorial: Silent line-up** (included) — everyone touches the app in minute one, and teams learn to coordinate.
2. Alternate **individual face-offs** (#5 vs #5) → **squad rounds** (rotate 3) → **EVERYONE rounds** → a **physical task**. Changing who's on duty every question keeps the whole room awake.
3. Show the scoreboard every 3–4 questions, not after every one — the reshuffle is more dramatic.
4. Make the last 2 questions worth double (e.g. `200,140,100,60`) so no team is ever out of it.

**Challenges built for “EVERYONE IS IMPORTANT”**
- **Chain answer**: rotate 1 player per question, five quick questions in a row → five different people must step up.
- **Mental-math sprint**: “every player” + number + Fastest correct — the team only finishes when its slowest member gets it, so teammates coach each other.
- **Secret number sum**: line-up with range 1–20; the team must find the two players whose numbers add to 21 without speaking.
- **Alphabet photo hunt**: every player sends a photo of an object starting with a different letter.
- **Human sculpture**: one photographer (rotate 1), whole team in the picture — you judge.
- **Rival selfie** (included) mixes teams socially.

**Fair-play rules you can enforce with deductions**
- −10 if a bench player touches the on-duty player's phone.
- −20 for talking during a silent challenge.
- +10 “team spirit” bonus when the bench is loudly helping (encourages cheering, not taking over).

**Optional upgrades I can add later**
- Sound effects / countdown music on the projector.
- A “streak” bonus for consecutive wins.
- Per-player MVP stats (most answers, most correct).
- Wager rounds (teams bet part of their points).
- Keep photos after the event (download all as a ZIP).

---

## Free-tier limits (Firebase Spark)
- 100 people connected at once, 1 GB stored, 10 GB downloaded per month — fine for ~80 players.
- Photo rounds are the heaviest part. If you run many, use **Reset scores & answers** between events to clear old photos.

## Troubleshooting
- **“Firebase isn't set up yet”** → `js/config.js` still has placeholders.
- **Host says “isn't a host yet”** → the `admins/<your UID>: true` entry is missing or the UID is wrong.
- **Can't create a team: operation-not-allowed** → enable Email/Password in Authentication.
- **Login works locally but not on GitHub** → add `YOUR-USERNAME.github.io` to Authorized domains.
- **Projector says sign in** → sign in on `host.html` in the same browser first, then reload `screen.html`.
- **A player lost their phone/battery** → on the new phone they sign in with the team login and tap their name under “Already joined?”.
- **Changes on GitHub don't show** → wait a minute and hard-refresh (phones may cache: close and reopen the tab).
