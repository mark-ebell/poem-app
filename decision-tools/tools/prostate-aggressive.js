// Histologically aggressive prostate cancer on first biopsy (EE+ 468). As on EE+, age and BMI count as whole numbers.
module.exports = {
  id: 'prostate-aggressive',
  eeId: 468,
  title: 'Prostate cancer: aggressive tumor on first biopsy',
  subtitle: 'Histologically aggressive prostate cancer on initial biopsy',
  question: 'For a man having a first prostate biopsy, how likely is histologically aggressive prostate cancer?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 30, max: 100, step: 1, ee: 'AGE' },
    { id: 'bmi', type: 'number', label: 'BMI', unit: 'kg/m²', min: 15, max: 50, step: 1, ee: 'BMI' },
    { id: 'psad', type: 'number', label: 'PSA density', unit: 'ng/mL/cc', min: 0.01, max: 5, step: 0.01, ee: 'PSAD' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'family', type: 'check', label: 'Family history of prostate cancer', ee: 'FAMILY' },
    { id: 'dre', type: 'check', label: 'Abnormal digital rectal exam', ee: 'DRE' }
  ],
  footnote: 'Baseline probability 12%.',
  compute(a) {
    const x = -3.28 + a.age / 10 * 0.54 + a.bmi * 0.06 + Math.log(a.psad) * 1.51 + 1.08 * a.dre + 0.82 * a.family;
    return { headline: `Probability of histologically aggressive prostate cancer: ${(100 / (1 + Math.exp(-x))).toFixed(1)}%` };
  }
};
