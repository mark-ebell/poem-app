// Richardson score: death or more than 3 days of ventilation in NICU infants of 34 weeks or more (Escobar 2004;
// EE+ 309). Points as on EE+: for a lowest pH of 7.25 to 7.29, 1 point with a pCO2 of 50 or more, otherwise 2.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'richardson-score',
  eeId: 309,
  title: 'Respiratory prognosis in the NICU (Richardson score)',
  subtitle: 'Death or prolonged ventilation in infants of 34 weeks or more',
  question: 'For an infant of 34 weeks or more admitted to the NICU, what is the risk of death or more than 3 days on a ventilator? (Use the worst values in the first 12 hours.)',
  inputs: [
    { id: 'pf', type: 'choice', label: 'PaO2/FiO2', ee: 'PO2', options: [{ label: '2.5 or more' }, { label: '1.2 to 2.49' }, { label: 'Under 1.2' }], note: 'Example: PaO2 140 and FiO2 70% gives 140/70 = 2.0.' },
    { id: 'ph', type: 'choice', label: 'Lowest pH', ee: 'PH', options: [{ label: '7.30 or more' }, { label: '7.25 to 7.29' }, { label: 'Under 7.25' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ga', type: 'check', label: 'Gestational age under 38 weeks', ee: 'IDC_CHECKBOX_1' },
    { id: 'map', type: 'check', label: 'Lowest mean arterial pressure under 30 mm Hg', ee: 'IDC_CHECKBOX_2' },
    { id: 'pco2', type: 'check', label: 'pCO2 50 mm Hg or more at any point', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const s = a.ga + a.map + [0, 2, 4][a.pf] + (a.ph === 1 ? (a.pco2 ? 1 : 2) : a.ph === 2 ? 2 : 0);
    return { score: { value: s, label: 'Score' }, ...(s === 0 ? { level: 1, headline: 'Low risk: 0.8% (6 of 778) died or were ventilated more than 3 days' }
      : s <= 2 ? { level: 2, headline: 'Moderate risk: 4.1% (33 of 800) died or were ventilated more than 3 days' }
      : s <= 5 ? { level: 3, headline: 'High risk: 18% (102 of 564) died or were ventilated more than 3 days' }
      : { level: 4, headline: 'Very high risk: 46% (62 of 134) died or were ventilated more than 3 days' }) };
  }
};
