// 4C mortality score for hospitalized COVID-19 (Knight 2020; validation Gordon 2022; EE+ 636). EE+ put a
// score of 14 in the very-high-risk group; in the 4C score, 9 to 14 is high and 15 or more very high.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'covid-4c',
  eeId: 636,
  title: '4C mortality score (COVID-19)',
  subtitle: 'In-hospital mortality in adults hospitalized with COVID-19',
  question: 'For an adult hospitalized with COVID-19, what is the risk of death in hospital?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', options: [['18 to 49', 0], ['50 to 59', 2], ['60 to 69', 4], ['70 to 79', 6], ['80 or older', 7]].map(([label, points]) => ({ label, points })) },
    { id: 'comorbid', type: 'choice', label: 'Number of comorbidities', ee: 'cboComorbidities', options: [['0', 0], ['1', 1], ['2 or more', 2]].map(([label, points]) => ({ label, points })),
      note: 'Chronic heart, lung, kidney or liver disease, neurologic disease, dementia, connective tissue disease, diabetes, HIV/AIDS, malignancy or obesity.' },
    { id: 'rr', type: 'choice', label: 'Respiratory rate', ee: 'cboRespRate', options: [['Under 20/min', 0], ['20 to 29', 1], ['30 or more', 2]].map(([label, points]) => ({ label, points })) },
    { id: 'bun', type: 'choice', label: 'BUN', ee: 'cboBUN', options: [['Under 20 mg/dL', 0], ['20 to 39', 1], ['40 or more', 3]].map(([label, points]) => ({ label, points })) },
    { id: 'crp', type: 'choice', label: 'C-reactive protein', ee: 'cboCRP', options: [['Under 5.0 mg/dL', 0], ['5.0 to 9.9', 1], ['10 or more', 2]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male sex at birth', points: 1, ee: 'cb1' },
    { id: 'sat', type: 'check', label: 'Oxygen saturation on room air below 92%', points: 2, ee: 'cb2' },
    { id: 'gcs', type: 'check', label: 'Altered mental status (Glasgow Coma Scale under 15)', points: 2, ee: 'cb3' }
  ],
  points: { label: '4C score', max: 21 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 3 ? { level: 1, headline: 'Low risk: 0.8% mortality' } : s <= 8 ? { level: 2, headline: 'Moderate risk: 5.3% mortality' }
      : s <= 14 ? { level: 3, headline: 'High risk: 22.3% mortality' } : { level: 4, headline: 'Very high risk: 50.6% mortality' };
  },
  evidence: { comment: 'The 4C score was derived by Knight SR, et al. BMJ 2020;370:m3339.' }
};
