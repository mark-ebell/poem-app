// HEART score (EE+ 543).
const { pct, postTest, pointsOf } = require('../lib');

const BANDS = [
  { min: 0, max: 3, label: 'Low risk', level: 1, lr: 0.2 },
  { min: 4, max: 4, label: 'Average risk', level: 2, lr: 0.8 },
  { min: 5, max: 6, label: 'High risk', level: 3, lr: 2.4 },
  { min: 7, max: 10, label: 'Very high risk', level: 4, lr: 13 }
];

const tool = module.exports = {
  id: 'heart',
  eeId: 543,
  title: 'HEART score',
  subtitle: 'Acute coronary syndrome in adults with chest pain',
  question: 'In an adult with chest pain in the emergency department, how likely is acute coronary syndrome (ACS)?',
  inputs: [
    { id: 'history', type: 'choice', label: 'History', ee: 'HISTORY', options: [
      { label: 'Incompatible with ACS', points: 0 }, { label: 'Potentially compatible with ACS', points: 1 }, { label: 'Strongly suggestive of ACS', points: 2 }] },
    { id: 'ecg', type: 'choice', label: 'ECG', ee: 'ECG', options: [
      { label: 'Normal', points: 0 }, { label: 'Nonspecific repolarization abnormalities', points: 1 }, { label: 'ST depression or transient ST elevation', points: 2 }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [
      { label: 'Under 45 years', points: 0 }, { label: '45 to 65 years', points: 1 }, { label: 'Over 65 years', points: 2 }] },
    { id: 'risk', type: 'choice', label: 'Risk factors', ee: 'RISKFACTORS',
      note: 'Risk factors: currently treated diabetes, current or recent (less than 1 month) smoker, diagnosed hypertension, diagnosed hyperlipidemia, family history of CAD, and obesity.',
      options: [{ label: 'None', points: 0 }, { label: '1 or 2 risk factors', points: 1 }, { label: '3 or more risk factors, or known CAD', points: 2 }] },
    { id: 'troponin', type: 'choice', label: 'Troponin', ee: 'TROPONIN', options: [
      { label: 'Normal', points: 0 }, { label: '1 to 3 times the upper limit of normal', points: 1 }, { label: 'More than 3 times the upper limit of normal', points: 2 }] },
    { id: 'pretest', type: 'number', label: 'Pretest probability of ACS', unit: '%', min: 0.1, max: 99.9, step: 0.1, default: 13, adjust: true,
      note: '13% is the overall rate of ACS in the validation studies. Change it to match your patient or setting.' }
  ],
  points: { label: 'HEART score', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    const b = BANDS.find(x => s >= x.min && s <= x.max);
    return {
      level: b.level,
      headline: b.label,
      lines: [`Probability of ACS: ${pct(postTest(a.pretest, b.lr))} (likelihood ratio ${b.lr}, pretest probability ${a.pretest}%)`],
      table: {
        head: ['Score', 'Risk group', 'Likelihood ratio', 'Probability of ACS'],
        rows: BANDS.map(x => [x.min === x.max ? `${x.min}` : `${x.min}–${x.max}`, x.label, String(x.lr), pct(postTest(a.pretest, x.lr))]),
        current: BANDS.indexOf(b)
      }
    };
  },
  evidence: {
    reference: 'Fanaroff AC, Rymer JA, Goldstein SA, et al. Does this patient with chest pain have acute coronary syndrome? The Rational Clinical Examination systematic review. JAMA. 2015;314(18):1955-1965.',
    comment: 'Likelihood ratios ranged from 0.20 for low risk to 13 for very high risk; the likelihood of ACS ranged from 2.9% to 66%.'
  }
};
