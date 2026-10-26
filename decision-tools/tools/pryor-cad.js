// Probability of significant coronary artery disease in outpatients (Pryor; EE+ 41).
const { logistic } = require('../lib');

module.exports = {
  id: 'pryor-cad',
  eeId: 41,
  title: 'Significant CAD in outpatients (Pryor)',
  subtitle: 'Probability of significant coronary artery disease',
  question: 'In an outpatient with chest pain referred for testing, how likely is significant coronary artery disease?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'AGE' },
    { id: 'pain', type: 'choice', label: 'Type of pain', ee: 'ANGINA', options: [{ label: 'Typical angina' }, { label: 'Atypical angina' }, { label: 'Non-anginal' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' },
    { id: 'mi', type: 'check', label: 'History of MI', ee: 'MI' },
    { id: 'q', type: 'check', label: 'Q waves on ECG', ee: 'Q_WAVE' },
    { id: 'lipids', type: 'check', label: 'Hyperlipidemia', ee: 'HYPER' },
    { id: 'stt', type: 'check', label: 'ST-T wave changes on ECG', ee: 'ST_T' },
    { id: 'diabetes', type: 'check', label: 'Diabetes', ee: 'DIABETES' },
    { id: 'smoking', type: 'check', label: 'Smoking', ee: 'SMOKING' }
  ],
  compute(a) {
    const f = +a.female, mi = +a.mi, q = +a.q, sm = +a.smoking, lip = +a.lipids;
    const x = -7.736 + 0.1126 * a.age - 0.328 * f - 0.0301 * a.age * f + 2.581 * (a.pain === 0) + 0.976 * (a.pain === 1)
      + 1.093 * mi + 1.213 * q + 0.741 * mi * q + 2.596 * sm + 1.845 * lip + 0.694 * a.diabetes + 0.637 * a.stt
      - 0.0404 * a.age * sm - 0.0251 * a.age * lip + 0.55 * f * sm;
    return { headline: `Probability of significant CAD: ${Math.round(logistic(x))}%` };
  }
};
