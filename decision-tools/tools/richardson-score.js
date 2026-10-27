// Richardson score: death or more than 3 days of assisted ventilation in NICU infants of 34 weeks or more
// (Escobar 2004; EE+ 309). Points from Table III of the paper: for a lowest pH of 7.25 to 7.29, 0 points with a
// PaCO2 under 50 and 1 point with 50 or more (EE+'s code fell through to 2 points when PaCO2 was under 50).
// Risks by score are from Table IV (entire cohort).
const RISK = ['6 of 778 (0.8%)', '17 of 413 (4.1%)', '16 of 387 (4.1%)', '25 of 205 (12.2%)', '42 of 236 (17.8%)', '35 of 123 (28.5%)', '39 of 89 (43.8%)', '18 of 35 (51.4%)', '5 of 10 (50.0%)'];

module.exports = {
  id: 'richardson-score',
  eeId: 309,
  title: 'Respiratory prognosis in the NICU (Richardson score)',
  subtitle: 'Death or prolonged ventilation in infants of 34 weeks or more',
  question: 'For an infant of 34 weeks or more admitted to the NICU, what is the risk of death or more than 3 days of assisted ventilation?',
  inputs: [
    { id: 'pf', type: 'choice', label: 'Worst PaO2/FiO2', ee: 'PO2', options: [{ label: '2.5 or more' }, { label: '1.2 to 2.49' }, { label: 'Under 1.2' }], note: 'Example: PaO2 140 and FiO2 70% gives 140/70 = 2.0.' },
    { id: 'ph', type: 'choice', label: 'Worst (lowest) pH', ee: 'PH', options: [{ label: '7.30 or more' }, { label: '7.25 to 7.29' }, { label: 'Under 7.25' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pco2', type: 'check', label: 'PaCO2 50 mm Hg or more on the same gas (matters only for a pH of 7.25 to 7.29)', ee: 'IDC_CHECKBOX_3' },
    { id: 'ga', type: 'check', label: 'Gestational age under 38 weeks', ee: 'IDC_CHECKBOX_1' },
    { id: 'map', type: 'check', label: 'Lowest mean arterial pressure under 30 mm Hg', ee: 'IDC_CHECKBOX_2' }
  ],
  footnote: 'Use arterial blood gases only (not capillary or venous), and the worst values in the first 12 hours in the special care nursery.',
  compute(a) {
    const s = a.ga + a.map + [0, 2, 4][a.pf] + (a.ph === 1 ? (a.pco2 ? 1 : 0) : a.ph === 2 ? 2 : 0);
    const level = s === 0 ? 1 : s <= 2 ? 2 : s <= 5 ? 3 : 4;
    return { score: { value: s, max: 8, label: 'Richardson score' }, level, headline: `${RISK[s]} with this score died or were ventilated more than 3 days` };
  },
  evidence: { comment: 'Points from Table III and risks by score from Table IV of the paper (entire Kaiser Permanente cohort). Also validated in a separate dataset (c-statistic 0.80).' }
};
