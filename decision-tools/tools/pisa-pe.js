// Pisa model for pulmonary embolism (Miniati; EE+ 308).
const ITEMS = [['male', 'Male', 0.81, 'IDC_CHECKBOX_1'], ['hemoptysis', 'Hemoptysis', 0.89, 'IDC_CHECKBOX_7'], ['cvd', 'Pre-existing cardiovascular disease', -0.56, 'IDC_CHECKBOX_2'],
  ['lung', 'Pre-existing pulmonary disease', -0.97, 'IDC_CHECKBOX_3'], ['phlebitis', 'History of thrombophlebitis', 0.69, 'IDC_CHECKBOX_4'], ['dyspnea', 'Dyspnea of sudden onset', 1.29, 'IDC_CHECKBOX_5'],
  ['rv', 'ECG signs of acute right ventricular overload', 1.53, 'IDC_CHECKBOX_9'], ['pain', 'Chest pain', 0.64, 'IDC_CHECKBOX_6'], ['fever', 'Fever above 38 °C (100.4 °F)', -1.17, 'IDC_CHECKBOX_8']];
const AGE = [0, 0.59, 0.92];
const CXR = [0, 3.86, 3.92, 3.55, -1.23, -2.83];

module.exports = {
  id: 'pisa-pe',
  eeId: 308,
  title: 'Pulmonary embolism diagnosis (Pisa model)',
  subtitle: 'Probability of PE from clinical findings, ECG and chest x-ray',
  question: 'For a patient with suspected pulmonary embolism, how likely is PE?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'age', options: [{ label: 'Under 63' }, { label: '63 to 72' }, { label: 'Over 72' }] },
    { id: 'cxr', type: 'choice', label: 'Chest x-ray', ee: 'cxr', options: [{ label: 'Normal' }, { label: 'Oligemia' }, { label: 'Amputation of the hilar artery' }, { label: 'Consolidation (infarction)' }, { label: 'Consolidation (no infarction)' }, { label: 'Pulmonary edema' }] },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, , ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const x = -3.26 + ITEMS.reduce((n, [id, , b]) => n + (a[id] ? b : 0), 0) + AGE[a.age] + CXR[a.cxr];
    const p = 100 / (1 + Math.exp(-x));
    return { level: p < 10 ? 1 : p < 50 ? 2 : p < 80 ? 3 : 4, headline: `Probability of PE: ${p.toFixed(1)}%` };
  }
};
