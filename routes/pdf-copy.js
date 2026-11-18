// Upload tab: a copy of each PDF an editor uploads is saved to Mark Ebell's Google Drive, in
// a folder for the POEM's month ("2027 January POEMs PDFs") inside the "PDF folders" folder,
// named "2026-11-15 Ebell - original name.pdf". The saving is done by a Google Apps Script web
// app that runs as Mark (google-drive/save-pdf.gs; set-up steps at its top). Settings:
//   PDF_DRIVE_URL     the web app's URL (ends in /exec)
//   PDF_DRIVE_SECRET  the password set in the script's properties as SECRET
// With either unset, nothing is copied (and the Upload tab says nothing about it).
const express = require('express');
const db = require('../db');
const { requireEditor } = require('../auth');

const router = express.Router();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const configured = () => !!(process.env.PDF_DRIVE_URL && process.env.PDF_DRIVE_SECRET);
const monthFolder = (year, month) => `${year} ${MONTHS[Number(month) - 1]} POEMs PDFs`;

// Sends a file to the Apps Script, which saves it in the month's folder. Returns { url }, or
// throws an Error whose message is for the editor. mimeType other than PDF needs version 2 of
// the script (it labels the file correctly); replace: true puts the file in place of one of
// the same name (version 2 too).
async function saveToDrive({ folder, fileName, data, mimeType = 'application/pdf', replace = false }) {
  let resp;
  try {
    resp = await fetch(process.env.PDF_DRIVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.PDF_DRIVE_SECRET, folder, fileName, mimeType, replace, data: data.toString('base64') }),
      redirect: 'follow',
      signal: AbortSignal.timeout(60000)
    });
  } catch (err) {
    console.error('Google Drive copy failed', err.message);
    throw new Error('Could not reach Google Drive.');
  }
  const text = await resp.text();
  let out; try { out = JSON.parse(text); } catch { out = null; }
  if (!resp.ok || !out || !out.ok) {
    console.error('Google Drive copy failed', resp.status, (out && out.error) || text.slice(0, 300));
    // A web page instead of the script's answer usually means a Google sign-in page (the web app's
    // access is not "Anyone") or a Google error page; its title says which.
    const title = (/<title>([^<]*)<\/title>/i.exec(text) || [])[1];
    throw new Error(out && out.error ? out.error
      : `Google answered with ${title ? `a page titled "${title.trim()}"` : `status ${resp.status}`} instead of the script's reply. Check that the web app is deployed with Execute as: Me and Who has access: Anyone, and that the script has been allowed to use your Drive.`);
  }
  if (mimeType !== 'application/pdf' && !(out.v >= 2)) {
    throw new Error('The file was saved, but the Google script is the old version, which marks every file as a PDF. Delete that file in Drive, update the script from google-drive/save-pdf.gs (Deploy > Manage deployments > Edit > Version: New version) and save again.');
  }
  return { url: out.url || null };
}

router.get('/', requireEditor, (req, res) => res.json({ enabled: configured() }));

// Body: the PDF. Query: name (the file's own name), month (YYYY-MM, the POEM's publication month).
router.post('/', requireEditor, express.raw({ type: () => true, limit: '40mb' }), async (req, res) => {
  if (!configured()) return res.status(503).json({ error: 'Saving to Google Drive is not set up.' });
  const pdf = req.body;
  if (!Buffer.isBuffer(pdf) || pdf.length < 5 || pdf.subarray(0, 5).toString() !== '%PDF-') {
    return res.status(400).json({ error: 'That is not a PDF file.' });
  }
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(req.query.month || ''));
  if (!m) return res.status(400).json({ error: 'No month given.' });
  const user = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.session.userId) || {};
  const clean = s => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
  let original = clean(req.query.name).replace(/\.pdf$/i, '').slice(0, 150) || 'article';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
  const fileName = `${today} ${clean(user.display_name) || 'Editor'} - ${original}.pdf`;
  const folder = monthFolder(m[1], m[2]);
  try {
    const { url } = await saveToDrive({ folder, fileName, data: pdf });
    res.json({ ok: true, folder, fileName, url });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
// Also used by Browse POEMs (routes/poems.js) to save the month's Word document.
module.exports.saveToDrive = saveToDrive;
module.exports.monthFolder = monthFolder;
module.exports.driveConfigured = configured;
