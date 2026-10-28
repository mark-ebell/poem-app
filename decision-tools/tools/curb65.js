// CURB-65 (Lim 2003; validated by Aujesky 2005; EE+ 312).
const OUT = ['6/1057 (0.6%)', '27/928 (2.9%)', '47/822 (5.7%)', '51/434 (12%)', '11/75 (15%)', '3/10 (30%)'];
const { count } = require('../lib');
module.exports = {
  id: 'curb65',
  eeId: 312,
  title: 'Pneumonia prognosis (CURB-65)',
  subtitle: 'Mortality in community-acquired pneumonia',
  question: 'For a patient with pneumonia, what is the CURB-65 score and mortality?',
  inputs: [
    { id: 'confusion', type: 'check', label: 'Confusion (including new disorientation to person, place or time)', ee: 'IDC_CHECKBOX_4' },
    { id: 'bun', type: 'check', label: 'BUN over 19 mg/dL (7 mmol/L)', ee: 'IDC_CHECKBOX_3' },
    { id: 'rr', type: 'check', label: 'Respiratory rate 30/min or more', ee: 'IDC_CHECKBOX_1' },
    { id: 'bp', type: 'check', label: 'Diastolic BP under 60 mm Hg or systolic BP under 90 mm Hg', ee: 'IDC_CHECKBOX_2' },
    { id: 'age', type: 'check', label: 'Age 65 years or older', ee: 'IDC_CHECKBOX_5' }
  ],
  footnote: 'The CRB-65 has also been prospectively validated in 315 patients over 65: mortality was 0.9% with a score of 1, 8% with 2 and 13% with 3.',
  compute(a) {
    const n = count(a, ['confusion', 'bun', 'rr', 'bp', 'age']);
    return { score: { value: n, max: 5, label: 'CURB-65' }, level: n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4, headline: `Mortality ${OUT[n]}` };
  }
};
