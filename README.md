# InfoRetriever

(InfoRetriever was previously called the POEM Generator; the GitHub repository and the Render service keep their original names.)

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

### 3. Create the POET accounts

The accounts listed in `POETS` in `seed-users.js` (Barry, Ebell, Shaughnessy, Slawson, Speer, Rowland, Rayala) are created automatically every time the server starts, with one-time initial passwords printed to the console (or, on Render, to the **Logs** tab) for any that don't exist yet. To add a new POET later, add a `{ username, displayName }` entry to that list (and to `VALID_POETS` in `routes/poems.js` and the POET `<select>` in `public/index.html`), then deploy — their account is created on the next boot. You can also create/check accounts manually at any time:

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
2. The app has five tabs: **Upload**, **Browse**, **Search**, **Evidence** and **Edit**.
3. On **Upload**, upload a PDF of the research article and click **Generate POEM** (can take up to a minute) — this switches you to the **Edit** tab with the draft loaded.
4. On the **Edit** tab, each element of the POEM has its own field: **Title**, **POET** (author), **Publication date**, **Reference**, **Clinical question**, **Allocation**, **Funding**, **Study design**, **Population and setting**, **Age group**, **Supertype**, **Level of evidence**, **PubMed ID**, **Synopsis** and **Bottom-line**. A generated draft fills these in for you. POET, publication date and title are required before you can save. The **POEM number** is assigned automatically (a unique 6-digit number) the first time a POEM is saved. The **PubMed URL** is built from the PubMed ID (enter `NA` if there is no PubMed entry).
   - The **Synopsis** and **Bottom-line** are rich-text boxes: **B** / **I** / **U** / **x²** (superscript) / **x₂** (subscript) apply formatting to selected text, and **🔗 Link** turns selected text into a hyperlink (asks for a URL). The other fields are plain text or drop-down lists.
5. To use track changes: check **Track changes**, then just start editing the Synopsis or Bottom-line. A moment after you stop typing (or as soon as you click away from the box), your edits are automatically marked up — insertions in green/underlined, deletions in red/struck-through. **Accept all changes** keeps them, **Reject all changes** discards them back to how the text looked when you turned tracking on; either way you keep editing normally afterward. **Show changes now** forces an immediate update instead of waiting for the pause.
   - Tracking only marks *content* changes in the Synopsis and Bottom-line, not formatting or the other fields, and only within your current editing session (it isn't stored alongside the saved POEM). Any changes still pending when you save are accepted into the saved text.
6. **Save** adds the POEM to the shared repository (or updates it, if you opened it from the list) and stays on the Edit tab; **Save and Exit** does the same and jumps to **Upload** to show it in the table.
7. The **Recently added POEMs** table lists the 50 most recent POEMs anyone on the team has written in the app, newest publication date first (POEMs with the same date: most recently added first). Click a column header (**POET**, **Publication Date**, **Title**) to sort by it; click again to reverse. **Edit** (or the title) loads it into the Edit tab, **Delete** removes it (with an inline "Are you sure?" step) — for everyone, since the repository is shared.
8. **Change password** (top right) lets you update your own password at any time.

## The database and importing the POEMs repository

Every POEM is one row in the `poems` table of `data/poems.db`, with each element in its own column: `title`, `poet`, `publication_date` (`YYYY-MM`), `reference`, `clinical_question`, `allocation`, `funding`, `study_design`, `setting` (population and setting), `age_group` (1 adults, 2 children, 3 both, 0 not specified), `supertype`, `loe`, `synopsis` and `bottom_line` (HTML), `pubmed_id` (a PMID, `NA`, or empty) and `pubmed_url`, plus `poem_id` (the POEM number), `poet_initials`, `pub_date_exact`, `category`, `source` (`app` or `import`) and who/when created and updated. The `poem_id` is not enforced as unique because the historical repository contains a few duplicated numbers.

The historical repository spreadsheet (`EBP_Data` sheet) is loaded with:

```bash
node import-spreadsheet.js "/path/to/POEMs repository.xlsx" --dry-run   # report only, writes nothing
node import-spreadsheet.js "/path/to/POEMs repository.xlsx"             # import
node import-spreadsheet.js "/path/to/POEMs repository.xlsx" --replace   # re-import (replaces previously imported rows only)
```

Rows with a blank POEM_ID get a new unique random 6-digit number. Values are loaded as they appear in the spreadsheet (including older spellings of study design and truncated POET entries). The four current POETs' initials (ME, HB, AS, DS) are shown as Ebell, Barry, Shaughnessy and Slawson; other initials are kept as they are. A copy of the database is saved to `data/backups/` before every import. POEMs that were saved before these fields existed are converted automatically the first time the server starts (the original text is kept in `legacy_html`).

### Searching

The **Search** tab finds POEMs containing words or phrases in the title, reference, clinical question, synopsis, bottom line, POEM number or PubMed ID. It is a Boolean search: combine words with `AND`, `OR` and `NOT` (capital letters; lower-case "and", "or", "not" are ordinary words), group with brackets, and put an exact phrase in quotes, for example `"atrial fibrillation" AND dabigatran NOT warfarin`. Words with no operator between them are combined with AND; `NOT` binds tighter than `AND`, which binds tighter than `OR`. Words are matched whole (searching for `ace` does not match "place"); use `*` as a wildcard for any run of letters or digits, e.g. `hypertens*` finds hypertension and hypertensive, `"heart fail*"` works inside a phrase, and `*statin` finds words ending in "statin". A term with a wildcard needs at least two other characters. Results show the publication date and title (matches highlighted); tick **Show the first 50 words of each synopsis** to add an excerpt. Each POEM keeps a plain-text copy of its searchable content in the `search_text` column (HTML tags removed); it is rebuilt automatically for any POEM that lacks one when the server starts, and updated whenever a POEM is saved. When keywords are added, include them in `buildSearchText` in `search.js`.

The dropdown beside the **Search** button limits how far back to look (last 1, 2, 3, 5 or 10 years, or the entire database — the default), by publication date.

Clicking a search result opens the POEM in a pop-up (9-point type, laid out like the printouts, with your search words highlighted) instead of the Edit tab; **Close**, the Escape key, or a click outside it dismisses the pop-up, and **Edit this POEM** opens it in the Edit tab.

After a search, **Print Word doc** downloads a `.docx` and **Print PDF** opens the browser's print window (choose "Save as PDF" as the destination). Both contain every matching POEM in full, one per page: a bold 12-point title, then POET, publication date and POEM number, then the fields with bold labels in 10-point type (with the level of evidence in parentheses after the study design). A search must match 500 POEMs or fewer to be printed (the results list itself shows the first 300); the same date range applies.

### Evidence Summary

The **Evidence** tab creates an Evidence Summary. Enter the **Topic** (words, with the same AND / OR / NOT, quotes and `*` syntax as the Search tab), choose **Limit POEMs search to:** (1, 2, 3, 5 or 10 years, or the entire database), **Limit PubMed search to:** (1, 3, 5 or 10 years, or no limit), an **Age group** (All ages, Child (birth to 18 years) or Adult (19+ years); it narrows both the POEMs, using their age group field — 1 adults, 2 children, 3 no age restriction, so a POEM for "both" matches either choice and POEMs with no age group recorded are left out — and the PubMed search), a **PubMed content area** (or all of them), and whether to **Limit search to high yield journals** (on by default); then click **Generate Evidence Summary**, which downloads a Word document. (Printing the POEMs from a search is separate: **Print Word doc** and **Print PDF** on the Search tab.) If the Topic is empty when you open the tab, it starts with whatever is in the Search tab's box.

The document is titled "Evidence Summary: <your topic>" (with the preparation date on the line below), and the downloaded file is named with the topic and the date. It begins with the matching POEMs (up to the 500 most recent), in five sections in this order — DIAGNOSIS (supertypes beginning Dx), TREATMENT (Tx, plus TCAM), SCREENING AND PREVENTION (Sc), PROGNOSIS (Px) and MISCELLANEOUS (all the rest, plus POEMs with no supertype) — and under each section the supertype's name (not its code), newest POEMs first. Each POEM shows, in 9-point type, its title and date, Reference with a PubMed link, Clinical question, Study design (with the level of evidence), Population and setting, Synopsis and Bottom-Line. The "PubMed literature" heading states the time span searched (e.g. "last 5 years" or "no time limit"), and a line below it names any age group, content area or high yield journal limit. The sections that follow list articles from PubMed organised by content area: the AMA reference, the PubMed ID, a link to the abstract and, when the article is in PubMed Central, a "Full text" link. Up to 25 of the most recent articles are listed per content area, with a link to run the full search in PubMed. Which supertype goes in which section is set in `evidence-summary.js`.

The **Cochrane reviews** content area (listed just after Practice guidelines) searches `The Cochrane database of systematic reviews`; because that journal is not on the high yield list, the high yield journal limit is not applied to it (the document says so under its heading).

The PubMed search string is built in `pubmed.js` from the strategy document ("Generating a search strategy for PubMed…"): `(your terms) AND (hasabstract[text] AND humans[MH] AND English[lang])`, then the age-group, content-area and journal clauses. Three typing slips in that document were corrected there (see the comments): an unmatched bracket in the Systematic Reviews clause, "prognosos" and a misplaced bracket in the Prognosis clause, and an empty `""[jour]` journal entry (plus a missing `[jour]` tag on BMC Fam Pract). The search uses NCBI's free E-utilities; set `NCBI_API_KEY` (optional) for a higher request limit.

### Browsing the POEMs

The **Browse** tab lists every POEM in the repository (the imported archive plus anything written in the app), filtered by publication year, month, author and age group. It opens on the most recent month. The list on the **Upload** tab shows only the 50 most recent POEMs written in the app.

### Importing a monthly batch from Word

Signed in as `ebell`, the **Browse** tab has a panel, **Administrator: import a monthly batch of POEMs from Word**. Choose the month's `.docx` file (a name such as `POEMs_2025_April_Final.docx` sets the month and year automatically; otherwise pick them), then **Read file**. The app lists the POEMs it found, showing the author, the PubMed ID, the age group and supertype, and any notes (for example "PubMed ID not found" or "no supertype"). POEMs already in the repository (same POEM ID, or same title in that month) are marked "Will be skipped". Nothing is saved until you click **Import**; a copy of the database is saved to `backups/` first.

Each POEM in the file starts with a `Title:` line. Recognised labels (any capitalisation): Title; Reference (or an unlabelled line right after the title); Question or Clinical question; Bottom line; Allocation; Funding or Funding Source; Design or Study design (a trailing `; LOE: 1b` is split off); Setting or Population and setting; Age group (Adults / Children / Both, or 1 / 2 / 3); Supertype (the code, or its name); Level of evidence; Synopsis; PubMed ID; POEM ID; and the author as `POET: name` or as initials in brackets such as `(ME)`. Missing PubMed IDs are looked up at PubMed by matching the citation (found IDs are checked against PubMed's title); a missing POEM ID gets a new random 6-digit number. Imported POEMs appear in the Recently added list and on Browse.

Author initials are turned into names in `poem-model.js` (ME Ebell, HB Barry, AS Shaughnessy, DS Slawson, LS Speer, NS Shrikant); the Browse author menu lists those POETs (plus Rowland and Rayala once they have POEMs) and puts everyone else under "Other authors".

## Deploying to Render (making it reachable on the internet)

This repo includes a `render.yaml` file that pre-fills most of the setup. The parts only you can do (they require your own accounts):

1. **Put this code on GitHub.** The simplest way for a non-technical setup is [GitHub Desktop](https://desktop.github.com/): install it, sign in with your (or a new, free) GitHub account, choose "Add an Existing Repository from your Hard Drive," pick this `poem-app` folder, then click "Publish repository."
2. **Create a free Render account** at https://render.com (you can sign up using your GitHub account, which also connects the two automatically).
3. In Render, click **New > Blueprint**, and pick the GitHub repository you just published. Render will read `render.yaml` and pre-fill almost everything — a web service on Render's paid "Starter" tier (~$7/month) with a small persistent disk (~$0.25/month for 1GB) attached, so the database survives restarts.
4. Render will prompt you for the one value it can't fill in itself: **ANTHROPIC_API_KEY**. Paste your key there (the same kind of key from `console.anthropic.com/settings/keys`).
5. Click **Deploy**. After a few minutes, Render gives you a public URL like `https://poem-generator-xxxx.onrender.com`.
6. Open that URL, and check Render's **Logs** tab once for the initial passwords (same as the local first-boot message) — share those with your fellow POETs along with the URL.

For future updates: once I make a change, publishing it from GitHub Desktop (or asking me to) triggers Render to automatically redeploy — no other steps needed.

## Notes on security and scope

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- Sessions are stored in the database (not just in memory), so they survive server restarts — a redeploy won't log everyone out.
- Repeated failed login attempts (10 within 15 minutes, per IP) are temporarily blocked to slow down password-guessing — relevant once the login page is reachable by anyone on the internet.
- Session cookies are marked "secure" (HTTPS-only) automatically once deployed; locally over plain `http://localhost` they still work as before.
- The POET accounts are fixed to the list in `seed-users.js` — there's no self-service sign-up, matching the closed POET roster.
- What this setup does **not** include: account lockout after repeated failures (only slowdown), email-based password reset, or protection against a compromised Anthropic key being used heavily (consider usage alerts in the Anthropic console).
- PDFs that are scanned images without a text layer won't extract text; you'd need to OCR them first.
- The database is a single file (`poems.db`, plus SQLite's `-wal`/`-shm` sidecars) — locally at `data/`, on Render on the attached persistent disk. Back it up by copying that file while the server isn't mid-write; there's no built-in export yet (the importer's backups in `data/backups/` are also plain copies of the database).
