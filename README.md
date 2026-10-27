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
2. The tabs are **Upload POEMs**, **Browse POEMs**, **Edit POEMs**, **Search POEMs**, **Evidence Summary**, **Topic Chapters**, **Edit Chapter**, **Differential Diagnosis**, **History & Physical**, **Diagnostic Tests** and **Risk Scores** (each name on two lines). Below, they are often called by their first word (Upload, Browse, Search, Evidence, Chapters, Edit), with H & P for History & Physical and Tests for Diagnostic Tests.
3. On **Upload**, upload a PDF of the research article and click **Generate POEM** (can take up to a minute) — this switches you to the **Edit** tab with the draft loaded.
4. On the **Edit** tab, each element of the POEM has its own field: **Title**, **POET** (author), **Publication date**, **Reference**, **Clinical question**, **Allocation**, **Funding**, **Study design**, **Population and setting**, **Age group**, **Category** (stored as `supertype`, the internal term), **Level of evidence**, **PubMed ID**, **Synopsis** and **Bottom-line**. A generated draft fills these in for you. POET, publication date and title are required before you can save. The **POEM number** is assigned automatically (a unique 6-digit number) the first time a POEM is saved. The **PubMed URL** is built from the PubMed ID (enter `NA` if there is no PubMed entry).
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

The **Search** tab finds POEMs containing words or phrases in the title, reference, clinical question, synopsis, bottom line, POEM number or PubMed ID. It is a Boolean search: combine words with `AND`, `OR` and `NOT` (capital letters; lower-case "and", "or", "not" are ordinary words), group with brackets, and put an exact phrase in quotes, for example `"atrial fibrillation" AND dabigatran NOT warfarin`. Words with no operator between them are combined with AND; `NOT` binds tighter than `AND`, which binds tighter than `OR`. Words are matched whole (searching for `ace` does not match "place"); use `*` as a wildcard for any run of letters or digits, e.g. `hypertens*` finds hypertension and hypertensive, `"heart fail*"` works inside a phrase, and `*statin` finds words ending in "statin". A term with a wildcard needs at least two other characters. Results show the publication date and title (matches highlighted); tick **Show question and bottom-line answer of each POEM** to show each POEM's full Clinical question and Bottom-line under its title (for readers, under the first 25 results only). Each POEM keeps a plain-text copy of its searchable content in the `search_text` column (HTML tags removed); it is rebuilt automatically for any POEM that lacks one when the server starts, and updated whenever a POEM is saved. When keywords are added, include them in `buildSearchText` in `search.js`.

The dropdown beside the **Search** button limits how far back to look (last 1, 2, 3, 5 or 10 years, or the entire database — the default), by publication date.

The **Age group** filter (Adults, Children, Both adults and children) works as on the Browse tab. The **Category** filter groups the category codes: Diagnosis (codes beginning Dx), Treatment (Tx, plus TCAM), Screening & prevention (Sc), Prognosis (Px), and Other (everything else, including POEMs with no category). Changing a filter re-runs the search, and printing uses the same filters.

Clicking a search result opens the POEM in a pop-up (9-point type, laid out like the printouts, with your search words highlighted) instead of the Edit tab; **Close**, the Escape key, or a click outside it dismisses the pop-up. (To edit a POEM, open it from the Browse tab or the Recently added list.)

After a search, **Print Word doc** downloads a `.docx` and **Print PDF** opens the browser's print window (choose "Save as PDF" as the destination). Both contain every matching POEM in full, one per page: a bold 12-point title, then POET, publication date and POEM number, then the fields with bold labels in 10-point type (with the level of evidence in parentheses after the study design). A search must match 500 POEMs or fewer to be printed (the results list itself shows the first 300); the same date range applies.

### Evidence Summary

The **Evidence** tab creates an Evidence Summary. Enter the **Topic** (words, with the same AND / OR / NOT, quotes and `*` syntax as the Search tab), choose **Limit POEMs search to:** (1, 2, 3, 5 or 10 years, or the entire database), **Limit PubMed search to:** (1, 3, 5 or 10 years, or no limit), an **Age group** (All ages, Child (birth to 18 years) or Adult (19+ years); it narrows both the POEMs, using their age group field — 1 adults, 2 children, 3 no age restriction, so a POEM for "both" matches either choice and POEMs with no age group recorded are left out — and the PubMed search), a **PubMed content area** (or all of them), and whether to **Limit search to high yield journals** (on by default); then click **Generate Evidence Summary**, which downloads a Word document. (Printing the POEMs from a search is separate: **Print Word doc** and **Print PDF** on the Search tab.) If the Topic is empty when you open the tab, it starts with whatever is in the Search tab's box.

The document is titled "Evidence Summary: <your topic>" (with the preparation date on the line below), and the downloaded file is named with the topic and the date. It begins with the matching POEMs (up to the 500 most recent), in five sections in this order — DIAGNOSIS (supertypes beginning Dx), TREATMENT (Tx, plus TCAM), SCREENING AND PREVENTION (Sc), PROGNOSIS (Px) and MISCELLANEOUS (all the rest, plus POEMs with no category) — and under each section the category's name (not its code), newest POEMs first. Each POEM shows, in 9-point type, its title and date, Reference with a PubMed link, Clinical question, Study design (with the level of evidence), Population and setting, Synopsis and Bottom-Line. The "PubMed literature" heading states the time span searched (e.g. "last 5 years" or "no time limit"), and a line below it names any age group, content area or high yield journal limit. The sections that follow list articles from PubMed organised by content area: the AMA reference, the PubMed ID, a link to the abstract and, when the article is in PubMed Central, a "Full text" link. Up to 25 of the most recent articles are listed per content area, with a link to run the full search in PubMed. Which category goes in which section is set in `evidence-summary.js` (where categories are called supertypes).

The **Cochrane reviews** content area (listed just after Practice guidelines) searches `The Cochrane database of systematic reviews`; because that journal is not on the high yield list, the high yield journal limit is not applied to it (the document says so under its heading).

The PubMed search string is built in `pubmed.js` from the strategy document ("Generating a search strategy for PubMed…"): `(your terms) AND (hasabstract[text] AND humans[MH] AND English[lang])`, then the age-group, content-area and journal clauses. Three typing slips in that document were corrected there (see the comments): an unmatched bracket in the Systematic Reviews clause, "prognosos" and a misplaced bracket in the Prognosis clause, and an empty `""[jour]` journal entry (plus a missing `[jour]` tag on BMC Fam Pract). The search uses NCBI's free E-utilities; set `NCBI_API_KEY` (optional) for a higher request limit.

### Browsing the POEMs

The **Browse** tab lists every POEM in the repository (the imported archive plus anything written in the app), filtered by publication year, month, author and age group. It opens on the most recent month. Each result shows a short date (e.g. "Dec 26") and the title. The list on the **Upload** tab shows only the 50 most recent POEMs written in the app.

### Importing a monthly batch from Word

Signed in as `ebell`, the **Upload** tab has a panel, **Administrator: import a monthly batch of POEMs from Word**. Choose the month's `.docx` file (a name such as `POEMs_2025_April_Final.docx` sets the month and year automatically; otherwise pick them), then **Read file**. The app lists the POEMs it found, showing the author, the PubMed ID, the age group and category, and any notes (for example "PubMed ID not found" or "no category"). POEMs already in the repository (same POEM ID, or same title in that month) are marked "Will be skipped". Nothing is saved until you click **Import**; a copy of the database is saved to `backups/` first.

Each POEM in the file starts with a `Title:` line. Recognised labels (any capitalisation): Title; Reference (or an unlabelled line right after the title); Question or Clinical question; Bottom line; Allocation; Funding or Funding Source; Design or Study design (a trailing `; LOE: 1b` is split off); Setting or Population and setting; Age group (Adults / Children / Both, or 1 / 2 / 3); Supertype (the category: its code, or its name); Level of evidence; Synopsis; PubMed ID; POEM ID; and the author as `POET: name` or as initials in brackets such as `(ME)`. Missing PubMed IDs are looked up at PubMed by matching the citation (found IDs are checked against PubMed's title); a missing POEM ID gets a new random 6-digit number. Imported POEMs appear in the Recently added list and on Browse.

Author initials are turned into names in `poem-model.js` (ME Ebell, HB Barry, AS Shaughnessy, DS Slawson, LS and LF Speer, NS and NK Shrikant); the Browse author menu lists those POETs (plus Rowland and Rayala once they have POEMs) and puts everyone else under "Other authors".

## Editors and readers

There are two kinds of account:

- **Editors** are the POETs (the fixed accounts in `seed-users.js`). They log in with their user name and can use every tab.
- **Readers** are members of the public. They create their own account on the login screen with their email address and a password (at least 8 characters, with an upper case letter, 2 numbers and 2 special symbols), agree to the Terms of Use (`public/terms.html`), pass an "are you human" check, and confirm their address from an emailed link. A browser that has never had an account here is shown the sign-up form first; after that, the log-in form. Readers can reset a forgotten password by email.

What readers can do (the server enforces all of this; hiding tabs in the page is only for convenience):

- Only the **Browse**, **Search** and **Evidence** tabs, and only POEMs whose status is **Published**. They never see the POET, the POEM number, drafts, the Upload or Edit tabs, or the Word import.
- Clicking a POEM opens it in a pop-up: 10 point Arial, bold headings, no hard line breaks.
- Browse lists at most 200 titles at a time; Search shows at most 200 results, with the question and bottom-line answer (when asked for) under the first 25 only.
- Printing a search (Word or PDF) includes the first 25 matching POEMs.
- Evidence Summaries include up to the 500 most recent matching Published POEMs (the same cap as for editors, which keeps the server within its memory), and from PubMed only practice guidelines, Cochrane reviews and systematic reviews from at most the last 10 years.
- **Usage limits** (in `limits.js`): 40 POEMs opened an hour and 150 a day; 60 searches or browse pages an hour and 300 a day; 5 printouts or Evidence Summaries a day. A reader who reaches a daily limit on 3 days within a week is locked automatically.

To see reader accounts, or unlock one (on Render, from the service's **Shell** tab):

```
npm run readers                     # all readers
npm run readers -- locked           # locked readers only
npm run readers -- unlock name@example.com
npm run readers -- lock name@example.com
```

### Services the reader sign-up needs

Set these in `.env` locally, or in Render's **Environment** tab:

- **APP_URL**: the site's public address (for the links in emails), e.g. `https://inforetriever.org`.
- **RESEND_API_KEY** and **EMAIL_FROM**: an account at [Resend](https://resend.com) sends the confirmation and password-reset emails. Verify your sending domain there first. Without a key, emails are written to the server log instead, which is fine for local testing.
- **TURNSTILE_SITE_KEY** and **TURNSTILE_SECRET_KEY**: Cloudflare Turnstile (free, at dash.cloudflare.com > Turnstile) provides the "are you human" check on the sign-up form. Without them the check is skipped.

### Protection against scraping

Besides the usage limits: everything requires a login; POEMs are sent to readers one at a time, never as bulk data; known AI crawlers and common scraping tools are refused; `robots.txt`, a page tag and an `X-Robots-Tag` header ask search engines and AI crawlers to stay out; and each network address is limited to 1,000 requests per 15 minutes.

## Chapters (Essential Evidence textbook)

The **Chapters** tab (editors and readers) shows the Essential Evidence textbook one chapter at a time. Type part of a title to find a chapter. Each chapter shows its title, last update, authors (name, title, department, institution, city and state) and editors (names), then its sections (Background, Screening and prevention, Diagnosis, Treatment, Prognosis, Special populations, ...) as collapsible panels with the headings from the chapter template, then figures and the numbered references.

- Each recommendation's strength of evidence appears as **(SORT A)**, **(SORT B)** or **(SORT C)**; clicking it shows the SORT definitions.
- **Decision support**, the first panel, gathers the chapter's algorithms and its H & P and diagnostic test calculators (and, once chapters tag them, risk scores). Each calculator has a **Summary data** button: a pop-up table of every test or finding for that presentation with LR+, LR-, the post-test probability if positive and if negative, and sensitivity and specificity (hidden on phones), highest LR+ first. The pre-test probability starts at the cited studies' value (their median when they differ, or 50% if none was reported) and can be changed; the post-test columns update as it does (tests with several result levels get their own small table of result and likelihood ratio), and a button to open the calculator. For readers it counts as one calculator look-up.
- A citation number opens a small pop-up with the abbreviated reference and buttons for where to read it: PubMed, the POEM (green numbers mark POEMs), Cochrane Library, a web site or the Tests calculator. The reference list at the end gives the same links.
- "History and physical tests" and "Diagnostic tests" list calculator entries by SxDxNum; each opens the **H & P** or **Tests** tab at that specialty and presentation.
- "Figure 1" (an algorithm) opens in a pop-up drawn from the chapter's own boxes and arrows.
- For readers each chapter opened counts toward a limit of 10 an hour and 30 a day.

To add or update chapters from a content transfer: put the XML files (e.g. `EEE0001.xml`) in the `EEPlus chapters` folder next to this app, run `npm run build-chapters` here, then commit and push. It copies each chapter's XML to `chapters/xml/`, writes the chapter list `chapters/index.json`, removes chapters whose XML file has gone, and reports problems, such as a link to a POEM or calculator entry that doesn't exist, or an element with no heading (add its heading to `HEADINGS` in `chapter-convert.js`). The app converts a chapter from its XML when it is first opened (`chapter-convert.js`). A chapter saved in the Edit Chapter tab stays as saved even if a newer file arrives; the tab flags it.

## Edit Chapter (editors only)

The **Edit Chapter** tab is for keeping chapters current (the aim is to update each at least once a year). Choose a chapter; its parts appear as editable blocks.

- **Update with Claude** searches PubMed for the chapter's topic over the last 14 months (practice guidelines, Cochrane and systematic reviews, and trials, screening and prevention studies in high-yield journals; diagnostic, prognosis and clinical decision rule/risk score studies in all journals) plus InfoRetriever's POEMs from that time, and has Claude (Opus 5.5) review the chapter against them. Its suggestions arrive as tracked changes: deletions of out-of-date statements, corrected phrases, new bullets with their citations (new references are added automatically), new rows in tables (a new risk factor and its odds ratio goes into the Risk factors table, its citation on the Sources line), and new bottom-line recommendations with SORT ratings. Each change carries a short note on why and its sources; suggestions that cannot be placed exactly are listed above the chapter. An update takes a minute or two and costs well under a dollar.
- Claude's editorial rules (in `SYSTEM` in `chapter-update.js`): no excessive precision (OR 1.2, not 1.23; a leading-zero value such as 0.002 is fine); at most one new bullet per bottom line, two only rarely (a third is listed for you instead of placed); guidelines named in full with their abbreviation and year on first use in a section ("The European Academy of Allergy and Clinical Immunology (EAACI) guidelines (2025) recommend…"); overall approaches and guideline recommendations go in Treatment's first subheading, **Guidelines and overviews**. Claude may also add to template subheadings the chapter does not have yet (e.g. Clinical decision rules, The elderly); the editor always shows Guidelines and overviews, empty if need be, so you can fill it yourself.
- **Your own edits are tracked too**: typing appears as a green insertion and deleting as a red strikethrough, under your name. Backspacing over your own insertion simply removes it. Cmd/Ctrl+Z undoes. Bold, italic, superscript and subscript buttons format text (formatting is not tracked).
- The review bar steps through the changes (◀ ▶, or click a change), showing who made it and why, with **Accept**/**Reject** and **Accept all**/**Reject all**.
- **Tables**: **Insert table** adds one (you choose columns × rows) after the paragraph or list the cursor is in; **+ Row**, **+ Column**, **− Row**, **− Column** and **− Table** work on the table the cursor is in. Tab and Shift+Tab move between cells (Tab in the last cell adds a row). Each is tracked as a whole row, column or table. The Risk factors and Differential diagnosis tables have fixed columns and take rows only.
- **Insert reference** adds a citation at the cursor: search PubMed by PMID or words, or POEMs by POEM number or title words.
- The review is saved as you work, so you can stop and come back; **Discard review** throws it away without changing the chapter.
- **Save chapter** (allowed once every change is accepted or rejected) saves the chapter as a new version of its XML: references no longer cited are removed, new ones added, all renumbered, and the "Last updated" date becomes today. Every saved version is kept in the database (`chapter_versions`). **Download XML** gives the current version's file, e.g. for the master copy.

### Update plans and the monthly update

Each chapter has an **update plan** (open it under the chapter's title): the **PubMed search terms** used to find its new evidence (blank means the chapter title; PubMed syntax works, e.g. `"rhinitis, allergic"[MeSH] OR "hay fever"`, and **Test search** shows how many articles each kind of search finds), the **month** it is updated each year, and its **editor**. New chapters are given the month with the fewest chapters, so about 1/12 come due each month. The chapter list can show all chapters, those due this month, those assigned to you, or reviews in progress.

The **monthly update** sends the month's chapters (those without a review in progress) to Claude together, using Anthropic's Message Batches API: half the price of single updates, with results usually within an hour and always within a day. The evidence for each chapter is gathered first (a few minutes for a month's chapters). When Claude's answers arrive, each becomes that chapter's review in progress, exactly as **Update with Claude** would produce it. Each editor is then emailed the list of their chapters, and `CHAPTER_UPDATE_NOTIFY` gets the whole month's list. Start it with **Run this month's update now** in the Edit Chapter tab. With `CHAPTER_BATCH_AUTO=on` it also starts by itself early on the first day of each month. A chapter Claude could not do is marked as failed; run **Update with Claude** on it.

Settings (Render environment):
- `CHAPTER_BATCH_AUTO`: `on` to start each month's update automatically (off by default).
- `CHAPTER_EDITOR_EMAILS`: editors' addresses, e.g. `ebell=ebell@msu.edu,barry=…`.
- `CHAPTER_UPDATE_NOTIFY`: who gets the whole list (default `ebell@msu.edu`).
- `CHAPTER_BATCH_MAX`: the most chapters in one month's batch (default 60).

From the command line (Render: the service's **Shell** tab): `npm run chapter-batch -- status`, `npm run chapter-batch -- start [YYYY-MM]`, `npm run chapter-batch -- check` (collect finished results now instead of at the next 10-minute check).

Claude's rules (instructions and answer format) are in `chapter-rules.js` with a `RULES_VERSION`; change the version whenever the rules change. Every review records the model, rules version and search terms that produced it (shown under Claude's summary). Token use per chapter is kept in `chapter_batch_items`.

The pieces: `chapter-store.js` (files, saved versions, reviews), `chapter-plan.js` (update plans), `chapter-update.js` (evidence search, Claude, suggestions to tracked changes), `chapter-rules.js` (Claude's rules), `chapter-batch.js` (monthly updates), `chapter-xml-write.js` (editor content back to XML), `routes/chapter-edit.js`, and `public/chapter-editor.js`.

## Daily InfoPOEM email

Each weekday one POEM is emailed to subscribers (for now only ebell@msu.edu, while testing). When a POEM becomes **Published** (saved in the Edit tab or brought in by the monthly Word import) it is given a random weekday in its publication month that no other POEM has, today or later; only the months listed in `DAILY_POEM_MONTHS` take part (for now `2026-10`). From 6 a.m. US Eastern on that day the server sends it, once, to the addresses in `DAILY_POEM_RECIPIENTS` (comma-separated). A POEM taken out of Published, or moved to another month, gives up a day it has not yet been sent on.

The email's subject is "Daily InfoPOEM: <title>". It has the AAFP logo at the top left and "Powered by InfoRetriever" with the dog at the top right, then the POEM as readers see it (no POET or POEM number) with the Clinical question, Bottom-Line and Reference first, and the disclaimer and a link to InfoRetriever.org at the bottom. Its images are served from `public/email/` on the live site; that folder is exempt from the site's same-origin image policy and crawler filter so mail programs and their image proxies can load them.

From the command line (on Render, the service's **Shell** tab):

```
npm run daily-poem -- schedule            # which POEM goes out on which day, and which have been sent
npm run daily-poem -- send-test           # send today's POEM now, marked [Test]
npm run daily-poem -- send-test 369649    # send a particular POEM (by POEM number) now
npm run daily-poem -- preview 369649      # write the email to daily-poem-preview.html
```

Before sending to real subscribers, the email needs an unsubscribe link and a subscriber list.

## Risk Scores

The **Risk Scores** tab (editors and readers) holds clinical decision rules and risk scores brought over from the Essential Evidence Plus decision support tools (571 tools, archived in `../ee-decision-tools-archive/ee-decision-tools.json` before EE+ closed on 12/31/26). Conversion goes category by category; the tab's category list shows each category's progress (e.g. "Cardiovascular: DVT and PE (0 of 23 so far)"), and each category gets a review doc of EE+ errors and questions. Retired (outdated) tools: Duke treadmill (EE+ 4), Goldman/Lee ICU complications (21), Pryor CAD models (41, 42), Rouan AMI with normal ECG (43), Dankner CAD mortality (207), Diamond-Forrester (336), modified CHADS2 (613), the six angioplasty tools (19, 194, 199, 221, 299, 352), ORBIT (541), Otto AVR (20), Framingham 1991 risk profiles (33), NCEP ATP III (134), Silaruks LA thrombi (173), Koplan pacing (226), Lee EFFECT (246), Killip class (255), Fonarow ADHERE (307), the Doppler PAD exam (334), Feringa PAD prognosis (413), and the pre-op tools Detsky (2), Steyerberg AAA (17), L'Italien (29), POSSUM orthopedic (182), Arozullah pneumonia (195), CABG risk (290), the ACC/AHA 2002 algorithm (314), Mathew AF after CABG (408), and the stroke tools CHS stroke (145), CHADS2 (34, 363), van Walraven (306), Guy's score (45), Besson (127), Efstathiou (212), ECST carotid (35), Baird (146), the California TIA score (132), the hypercalcemia discriminant (25), lithium dosing (214), Herman (18) and Griffin (186) diabetes screens, Boyko foot ulcer (354), Harris-Benedict (105), and the GI tools Hank pancreatic cancer (639), Spiegelhalter dyspepsia (46), omeprazole response (128), Zimmerman (268) and Manterola (289) GERD scores, Weston Barrett's (283), Villanueva (24), Hay (119), Imrie (139), the 2002 AGA liver test algorithm (205), the HAIR (241) and Angulo NASH (237) scores, the hepatitis C tools Bonis (188), Kaul (196), Forns (228) and Metwally (390), Knowles constipation (215) and Wasson abdominal pain (172), Naylor gestational diabetes (10), the Dhall labor induction score (39), the Michigan warfarin adjustment (213) and the Wells OBRI validation (285); the infectious disease tools EuroSIDA (170), Rochester criteria (191), Isaacman bacteremia (253), Rothman HIV head CT (217), Leung SARS (281), Wisnivesky TB isolation (298), early goal-directed sepsis therapy (317), Talmor pandemic triage (388), Oostenbrink meningeal signs (416), the PECARN lab-based rule (578, a duplicate of 616) and the Melbourne ASSET score (584, a blank page on EE+), and the musculoskeletal tools New Orleans head CT (111), back pain evaluation guideline (184), TMJ disorders (223), Gran ankylosing spondylitis (224), ACR 1982 SLE criteria (233), Kaplan carpal tunnel (243), the FRACTURE index (287), NOF osteoporosis screen (300) and Solomon knee surgery referral (305); and the neurology tools Martin syncope (47), Grewal pediatric head injury (115), Inouye delirium (222), Golferini childhood headache (231), Hamel coma (260), the San Francisco Syncope Rule (379), the PECARN under-2 positive/negative version (460, a duplicate of 434) and EE+ 608 (titled as the 4AT but holding an unidentified endocarditis score), and the oncology tools Byar thyroid (27), Schuchter (37) and Aitchison (267) melanoma, Thorogood NSCLC (249), Schonwetter terminal lung cancer (259), D'Amico prostate (304), the Harvard pancreatic (269) and ovarian (270) relative risks, SEER ovarian (338), van der Linden spinal metastases (296) and Mann liver metastases (286), and APACHE II (234), the Walter discharge index (160, a duplicate of 583), Woloshin risk charts (164), van Walraven inpatient CPR (171), the Cooper Clinic index (324), the out-of-hospital CPR rule (342) and MEWS (403); the 2004 antiplatelet recommendations (284) and the 2004 AAP jaundice guideline (348) are held for review. EE+ 585 (the 2011 Genders model) is replaced by the ESC 2024 risk factor-weighted clinical likelihood model (`esc-2024-cad.js`), and EE+ 510 (the 2013 Pooled Cohort Equations) by the AHA PREVENT equations (`prevent.js`). CHARGE-AF (`charge-af.js`), not an EE+ tool, was added beside the Framingham AF score, the PHASES score (`phases.js`) beside ISUIA, and the Rome IV IBS criteria (`rome4-ibs.js`) beside Rome I. EE+ 193 (the 2001 MELD) is replaced by MELD 3.0 (`meld3.js`) and EE+ 200 (the 1998 Apfel ENT model) by the simplified Apfel score (`apfel-simplified.js`). EE+ 232 (the 1987 ARA rheumatoid arthritis criteria) is replaced by the 2010 ACR/EULAR criteria (`ra-2010.js`). EE+ 40 (an interpolation of the 1989 Gail tables) is replaced by the NCI Breast Cancer Risk Assessment Tool (`bcrat.js`), a port of the BCRA R package (2.1.2) that matches it to rounding error. EE+ 291 (USPSTF recommendations from about 2008) is replaced by the current USPSTF A and B recommendations (`uspstf-ab.js`, checked October 2026), listed by age, sex and risk factors. EGRIS (`egris.js`), not an EE+ tool, was added beside the Guillain-Barré ventilation score. Tools left out on purpose are listed in `decision-tools/excluded.json`.

Each tool is a module in `decision-tools/tools/`: its questions (choices, checkboxes, numbers, with points where it is a point score), a `compute` function, and any corrections to its evidence. The format is described at the top of `decision-tools/lib.js`. Each tool's reference, population, validation and PubMed link come from `decision-tools/ee-evidence.json`, made from the archive by `node scripts/ee-evidence.js`. The page gets a tool's questions and sends the answers to `POST /api/tools/:id/score`, so the formulas stay on the server. Opening a tool counts toward a reader's calculator look-ups.

Format decisions: every choice starts on its first option and checkboxes unchecked, so a result shows at once, as in EE+ (tools that need a number typed in, such as age or heart rate, show their result only once it is entered); no new management recommendations (EE+'s own wording is kept); a pretest probability is shown, and can be changed, only where the study gives likelihood ratios.

Branching algorithms (e.g. Goldman) use questions with `when` that appear only on their path. Each converted tool is checked against the original EE+ tool, run in jsdom with EE+'s own code, on every combination of answers (or 1,500 random ones): see `../ee-decision-tools-archive/harness/`. Errors found in EE+ and other questions are listed for review in the "Risk Scores review" doc for each category.

## Diagnostic calculators

The **Differential Diagnosis**, **History & Physical** (signs and symptoms) and **Diagnostic Tests** tabs (open to editors and readers) are the Bayesian diagnostic calculator from the `Diagnostic App` project folder. Their data, `calculator-data.json`, is produced from that project's spreadsheets (`DiagnosticCalculatorApp.xlsx` and `DifferentialDiagnosisData.xlsx`). To update it:

1. Edit the spreadsheet(s) in the `Diagnostic App` folder.
2. Run `python3 build/build.py` there. It rebuilds the standalone calculator page and the iOS app's copy, and writes `calculator-data.json` into this folder.
3. Commit and push this app; Render picks up the new data when it redeploys.

The page never receives the whole data set: menus are fetched one level at a time, and each test's numbers and source (or a symptom's ranked differential) only when chosen. For readers each of those counts as a calculator look-up (100 an hour, 400 a day).

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
- The POET (editor) accounts are fixed to the list in `seed-users.js`; self-service sign-up creates reader accounts only.
- What this setup does **not** include: account lockout after repeated failed logins (only slowdown), email-based password reset for editors (readers have it), or protection against a compromised Anthropic key being used heavily (consider usage alerts in the Anthropic console).
- PDFs that are scanned images without a text layer won't extract text; you'd need to OCR them first.
- The database is a single file (`poems.db`, plus SQLite's `-wal`/`-shm` sidecars) — locally at `data/`, on Render on the attached persistent disk. Back it up by copying that file while the server isn't mid-write; there's no built-in export yet (the importer's backups in `data/backups/` are also plain copies of the database).
