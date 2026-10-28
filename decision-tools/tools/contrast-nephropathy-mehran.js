// Contrast-induced nephropathy after PCI (Mehran 2004; EE+ 433). EE+ put a score of 16 in the
// high-risk group; the published very-high-risk group is 16 or more.
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'contrast-nephropathy-mehran',
  eeId: 433,
  title: 'Nephropathy risk with PCI',
  subtitle: 'Mehran score for contrast-induced nephropathy',
  question: 'For a patient undergoing percutaneous coronary intervention, what is the risk of contrast-induced nephropathy?',
  inputs: [
    { id: 'hypotension', type: 'check', label: 'Hypotension (SBP < 80 mm Hg for 1 hour or more requiring intervention)', points: 5, ee: 'HYPOTENSION' },
    { id: 'iabp', type: 'check', label: 'Intra-aortic balloon pump required within 24 hours', points: 5, ee: 'BALLOON' },
    { id: 'chf', type: 'check', label: 'Congestive heart failure', points: 5, ee: 'CHF' },
    { id: 'age75', type: 'check', label: 'Age over 75 years', points: 4, ee: 'AGE75' },
    { id: 'anemia', type: 'check', label: 'Anemia (hematocrit < 39% in men, < 36% in women)', points: 3, ee: 'ANEMIA' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', points: 3, ee: 'DM' },
    { id: 'contrast', type: 'number', label: 'Contrast media volume', unit: 'mL', min: 10, max: 1500, ee: 'CONTRAST', note: '1 point for each 100 mL.' },
    { id: 'creat', type: 'check', label: 'Serum creatinine > 1.5 mg/dL (133 µmol/L)', ee: 'CREAT' },
    { id: 'gfr', type: 'choice', label: 'eGFR (mL/min/1.73 m²)', ee: 'GFR', when: a => !a.creat, options: [{ label: 'Under 20' }, { label: '20 to 40' }, { label: '40 to 60' }, { label: 'Over 60' }] }
  ],
  footnote: 'Kidney function counts once: 4 points for a creatinine over 1.5 mg/dL, otherwise 2, 4 or 6 points for an eGFR of 40 to 60, 20 to 40 or under 20.',
  scoreOf(a) { return pointsOf(tool, a) + Math.floor(a.contrast / 100) + (a.creat ? 4 : [6, 4, 2, 0][a.gfr]); },
  compute(a) {
    const s = tool.scoreOf(a);
    const [level, cin, dial] = s <= 5 ? [1, '7.5', '0.04'] : s <= 10 ? [2, '14.0', '0.12'] : s <= 15 ? [3, '26.1', '1.09'] : [4, '57.3', '12.6'];
    return { score: { value: s, label: 'Risk score' }, level, headline: `Risk of nephropathy ${cin}%; risk of dialysis ${dial}%` };
  }
};
