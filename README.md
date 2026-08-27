# POEM Generator

A small local web application for a team of POETs (physicians who write POEMs): each person logs in, uploads a research article PDF, gets a first-draft POEM written by Claude, edits it with rich-text formatting and optional track-changes review, and saves it to a shared repository backed by a real database on disk — so it survives browser restarts, cache clears, and is visible to every logged-in author.

This is now a client/server app (Node.js + Express + SQLite), not a static page. The Anthropic API key lives only on the server; the browser never sees it.

## One-time setup

### 1. Install dependencies

From this folder:

```bash
npm install
```

### 2. Configure the server

Copy `.env.example` to `.env` and fill in a real Anthropic API key:

```bash
cp .env.example .env
```

Then edit `.env`:
- `ANTHROPIC_API_KEY` — required. Get one at https://console.anthropic.com/settings/keys. This one key is used for every logged-in user's draft generations and is billed to your Anthropic account (separate from a Claude.ai subscription — see https://www.anthropic.com/pricing).
- `SESSION_SECRET` — optional but recommended. Any long random string. If left blank, a new one is generated every time the server restarts, which logs everyone out. Generate one with `openssl rand -hex 32`.
- `PORT` — optional, defaults to 3000.

`.env` is gitignored — never commit it.

### 3. Create the five POET accounts

The five accounts (Barry, Ebell, Shaughnessy, Slawson, Speer) are created automatically the first time the server starts against a fresh database, with the one-time initial passwords printed to the console (or, on Render, to the **Logs** tab). You can also create/check them manually at any time:

```bash
npm run seed
```

Share each person's password with them securely (e.g., in person or via a password manager, not email/Slack in plain text). They'll be required to set their own password the first time they log in. Re-running this is always safe — it skips accounts that already exist.

If someone forgets their password, there's no self-service reset yet (no email is configured). Reset one from the project folder:

```bash
node -e "
const bcrypt = require('bcryptjs');
const db = require('./db');
const hash = bcrypt.hashSync('a-temporary-password', 10);
db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE username = ?').run(hash, 'ebell');
console.log('Password reset.');
"
```

## Running the app

```bash
npm start
```

Then open http://localhost:3000. This only listens on your Mac — it is not reachable from other devices or the internet.

## Using it

1. Sign in with your username (e.g. `ebell`) and password. First-time sign-in requires you to set a new password immediately.
2. The app has two tabs, **Upload and list** and **Edit**.
3. On **Upload and list**, upload a PDF of the research article and click **Generate POEM** (can take up to a minute) — this switches you to the **Edit** tab with the draft loaded.
4. On the **Edit** tab, choose a **POET** (author byline — not necessarily the account you're logged in as, if you're entering a POEM on someone else's behalf) and a **Publication date** — both are required before you can save — and edit the draft:
   - **B** / **I** / **U** / **x²** (superscript) / **x₂** (subscript) apply formatting to selected text.
   - **🔗 Link** turns selected text into a hyperlink (asks for a URL).
5. To use track changes: check **Track changes**, then just start editing. A moment after you stop typing (or as soon as you click away from the editor), your edits are automatically marked up — insertions in green/underlined, deletions in red/struck-through. **Accept all changes** keeps them, **Reject all changes** discards them back to how the document looked when you turned tracking on; either way you keep editing normally afterward. **Show changes now** forces an immediate update instead of waiting for the pause.
   - Tracking only marks *content* changes, not formatting, and only within your current editing session (it isn't stored alongside the saved POEM).
6. **Save** adds the POEM to the shared repository (or updates it, if you opened it from the list) and stays on the Edit tab; **Save and Exit** does the same and jumps to **Upload and list** to show it in the table.
7. The **Saved POEMs** table lists everything anyone on the team has saved. Click a column header (**POET**, **Publication Date**, **Title**) to sort; click again to reverse. **Edit** (or the title) loads it into the Edit tab, **Delete** removes it (with an inline "Are you sure?" step) — for everyone, since the repository is shared.
8. **Change password** (top right) lets you update your own password at any time.

## Deploying to Render (making it reachable on the internet)

This repo includes a `render.yaml` file that pre-fills most of the setup. The parts only you can do (they require your own accounts):

1. **Put this code on GitHub.** The simplest way for a non-technical setup is [GitHub Desktop](https://desktop.github.com/): install it, sign in with your (or a new, free) GitHub account, choose "Add an Existing Repository from your Hard Drive," pick this `poem-app` folder, then click "Publish repository."
2. **Create a free Render account** at https://render.com (you can sign up using your GitHub account, which also connects the two automatically).
3. In Render, click **New > Blueprint**, and pick the GitHub repository you just published. Render will read `render.yaml` and pre-fill almost everything — a web service on Render's paid "Starter" tier (~$7/month) with a small persistent disk (~$0.25/month for 1GB) attached, so the database survives restarts.
4. Render will prompt you for the one value it can't fill in itself: **ANTHROPIC_API_KEY**. Paste your key there (the same kind of key from `console.anthropic.com/settings/keys`).
5. Click **Deploy**. After a few minutes, Render gives you a public URL like `https://poem-generator-xxxx.onrender.com`.
6. Open that URL, and check Render's **Logs** tab once for the five initial passwords (same as the local first-boot message) — share those with your fellow POETs along with the URL.

For future updates: once I make a change, publishing it from GitHub Desktop (or asking me to) triggers Render to automatically redeploy — no other steps needed.

## Notes on security and scope

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- Sessions are stored in the database (not just in memory), so they survive server restarts — a redeploy won't log everyone out.
- Repeated failed login attempts (10 within 15 minutes, per IP) are temporarily blocked to slow down password-guessing — relevant once the login page is reachable by anyone on the internet.
- Session cookies are marked "secure" (HTTPS-only) automatically once deployed; locally over plain `http://localhost` they still work as before.
- The five accounts are fixed — there's no self-service sign-up, matching the closed POET roster.
- What this setup does **not** include: account lockout after repeated failures (only slowdown), email-based password reset, or protection against a compromised Anthropic key being used heavily (consider usage alerts in the Anthropic console).
- PDFs that are scanned images without a text layer won't extract text; you'd need to OCR them first.
- The database is a single file (`poems.db`, plus SQLite's `-wal`/`-shm` sidecars) — locally at `data/`, on Render on the attached persistent disk. Back it up by copying that file while the server isn't mid-write; there's no built-in export yet.
