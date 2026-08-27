# POEM Generator

A small local web app: upload a research article PDF, get a first-draft POEM written by Claude, then edit it with basic rich-text formatting and optional track-changes review, and save it to a library stored in your browser.

Everything runs in your browser. Your Anthropic API key and all saved POEMs are stored only in this browser's local storage — nothing is sent anywhere except the Anthropic API call to generate a draft.

## One-time setup

### Anthropic API key

1. Go to https://console.anthropic.com/settings/keys (create an account if you don't have one).
2. Create a new API key and copy it.
3. Paste it into the app's Settings panel. Note: Anthropic API usage is billed separately from a Claude.ai subscription — check pricing at https://www.anthropic.com/pricing.

## Running the app

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Using it

The app has two tabs, **Upload** and **Edit**.

1. Click **Settings**, paste in your Anthropic API key, click **Save settings**.
2. On the **Upload** tab, upload a PDF of the research article and click **Generate POEM** (can take up to a minute) — this switches you to the **Edit** tab with the draft loaded. Choose a **POET** (author) and a **Publication date** (current month through 12 months out) on the Upload tab — both are required before you can save.
3. On the **Edit** tab, edit the draft in the text box:
   - **B** / **U** / **x²** (superscript) / **x₂** (subscript) apply formatting to selected text.
   - **🔗 Link** turns selected text into a hyperlink (asks for a URL).
4. To use track changes: check **Track changes**, then just start editing. A moment after you stop typing (or as soon as you click away from the editor), your edits are automatically marked up — insertions in green/underlined, deletions in red/struck-through — compared with how the document looked when you turned tracking on. Click **Accept all changes** to keep everything marked so far, or **Reject all changes** to discard it and go back to the pre-edit version; either way you keep editing normally afterward. **Show changes now** forces an immediate update instead of waiting for the pause.
   - Note: tracking only marks *content* changes (added/removed text), not formatting changes like bold or underline, and it tracks changes made in your current session — turning tracking off keeps your edits without marking them, and it doesn't persist across reloading a saved document.
5. Click **Save** to add the POEM to your library (or update it, if you opened it from the library). The **Title** field is used as the document's name; it's pre-filled from the generated "Title:" line but you can edit it. Save is blocked until POET and Publication date are both selected.
6. Back on the **Upload** tab, the **Saved POEMs** section lists everything you've saved as a table. Click any column header (**POET**, **Publication Date**, **Title**) to sort by it; click again to reverse the order. Click **Edit** (or the title) to load it into the Edit tab, or **Delete** to remove it.
7. On the Edit tab, click **New** to clear the editor (including POET and Publication date) and start a fresh POEM without affecting your saved library.

## Notes

- PDFs that are scanned images without a text layer won't extract text; you'd need to OCR them first.
- Each generation calls the Anthropic API directly from your browser and is billed to your API key.
- Since everything is stored in browser local storage, your saved POEMs are tied to this browser on this computer. Clearing browser site data for this page will delete them. There's no built-in backup/export yet.
