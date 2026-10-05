const express = require('express');
const { requireAuth } = require('../auth');
const { generateEvidenceSummary } = require('../evidence-summary');

const router = express.Router();
router.use(requireAuth);

const parseYears = v => ([1, 2, 3, 5, 10].includes(Number(v)) ? Number(v) : null);

// { q, years, age, content, journals } -> an Evidence Summary Word document.
router.post('/summary', async (req, res) => {
  const b = req.body || {};
  const q = String(b.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'Enter the topic to search for first.' });
  try {
    const result = await generateEvidenceSummary({
      q,
      years: parseYears(b.years),
      age: String(b.age || 'all'),
      content: String(b.content || 'all'),
      journals: b.journals !== false && b.journals !== 'false' && b.journals !== '0'
    });
    if (result.error) return res.status(400).json({ error: result.error });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="Evidence Summary.docx"'
    });
    res.send(result.buffer);
  } catch (err) {
    console.error('Evidence summary failed', err);
    res.status(500).json({ error: 'Could not create the Evidence Summary. See the server log.' });
  }
});

module.exports = router;
