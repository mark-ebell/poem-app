// Early death in patients starting dialysis (Barrett 1997; EE+ 116).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'dialysis-barrett',
  eeId: 116,
  title: 'Dialysis prognosis (Barrett)',
  subtitle: 'Survival after starting dialysis for end-stage renal disease',
  question: 'For a patient starting dialysis, what is the probability of survival at 50 days, 6 months and 1 year?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 51 years', points: 1 }, { label: '51 to 60 years', points: 2 }, { label: '61 to 70 years', points: 3 }, { label: 'Over 70 years', points: 4 }] },
    { id: 'angina', type: 'choice', label: 'Angina', ee: 'IDC_COMBOBOX_2', options: [{ label: 'No angina or MI', points: 0 }, { label: 'New angina or MI more than 6 months ago', points: 1 }, { label: 'Stable angina or MI more than 6 months ago', points: 1 }, { label: 'Unstable angina or MI less than 6 months ago', points: 2 }] },
    { id: 'chf', type: 'choice', label: 'Congestive heart failure', ee: 'IDC_RADIO_1', options: [{ label: 'Symptoms on strenuous or prolonged activity, or prior history of CHF', points: 1 }, { label: 'CHF on ordinary activity, at rest, or recurrent admission for CHF', points: 2 }, { label: 'None', points: 0 }] },
    { id: 'vent', type: 'check', label: 'Requires ventilator or in coma', points: 4, ee: 'IDC_CHECKBOX_1' },
    { id: 'gangrene', type: 'check', label: 'Gangrene (inoperable) or surgery for peripheral vascular disease in the last 6 months', points: 2, ee: 'IDC_CHECKBOX_3' },
    { id: 'liver', type: 'check', label: 'Severe liver disease or in shock', points: 4, ee: 'IDC_CHECKBOX_4' },
    { id: 'cancer', type: 'check', label: 'Metastatic cancer, blood dyscrasia, or refractory melanoma', points: 2, ee: 'IDC_CHECKBOX_5' },
    { id: 'arrhythmia', type: 'check', label: 'Treated arrhythmia present', points: 2, ee: 'IDC_CHECKBOX_2' }
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a);
    const [level, risk, d50, m6, y1] = s < 5 ? [1, 'Low risk (0 to 4 points)', 97, 95, 90] : s < 9 ? [2, 'Moderate risk (5 to 8 points)', 88, 71, 62] : [4, 'High risk (more than 8 points)', 57, 46, 46];
    return { level, headline: risk, lines: [{ label: '50-day survival', value: `${d50}%` }, { label: '6-month survival', value: `${m6}%` }, { label: '1-year survival', value: `${y1}%` }] };
  }
};
