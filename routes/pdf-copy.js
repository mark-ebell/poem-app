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
  const folder = `${m[1]} ${MONTHS[Number(m[2]) - 1]} POEMs PDFs`;
  try {
    const resp = await fetch(process.env.PDF_DRIVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.PDF_DRIVE_SECRET, folder, fileName, data: pdf.toString('base64') }),
      redirect: 'follow',
      signal: AbortSignal.timeout(60000)
    });
    const text = await resp.text();
    let out; try { out = JSON.parse(text); } catch { out = null; }
    if (!resp.ok || !out || !out.ok) {
      console.error('Google Drive copy failed', resp.status, (out && out.error) || text.slice(0, 300));
      // A web page instead of the script's answer usually means a Google sign-in page (the web app's
      // access is not "Anyone") or a Google error page; its title says which.
      const title = (/<title>([^<]*)<\/title>/i.exec(text) || [])[1];
      const why = out && out.error ? out.error
        : `Google answered with ${title ? `a page titled "${title.trim()}"` : `status ${resp.status}`} instead of the script's reply. Check that the web app is deployed with Execute as: Me and Who has access: Anyone.`;
      return res.status(502).json({ error: why });
    }
    res.json({ ok: true, folder, fileName, url: out.url || null });
  } catch (err) {
    console.error('Google Drive copy failed', err.message);
    res.status(502).json({ error: 'Could not reach Google Drive.' });
  }
});

module.exports = router;
