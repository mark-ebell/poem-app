// Somatization among high users of outpatient care (EE+ 169).
module.exports = {
  id: 'somatizer',
  eeId: 169,
  title: 'Somatization in high users of outpatient care',
  subtitle: 'Which frequent attenders are somatizers',
  question: 'For a patient with 6 or more outpatient visits in a year, how likely is somatization?',
  inputs: [
    { id: 'visits', type: 'number', label: 'Outpatient visits in the past year', min: 6, max: 200, step: 1, ee: 'IDC_EDIT_1' },
    { id: 'pct', type: 'number', label: 'Visits with a primary diagnosis that was nervous system, GI, musculoskeletal or ill-defined', unit: '%', min: 1, max: 100, step: 1, ee: 'IDC_EDIT_2' },
    { type: 'heading', label: 'Check if present' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const x = -7.42 + 1.146 * (a.male ? 0 : 1) + 0.166 * a.visits + 0.057 * a.pct;
    return { headline: `Probability that the patient is a somatizer: ${(100 / (1 + Math.exp(-x))).toFixed(1)}%` };
  }
};
