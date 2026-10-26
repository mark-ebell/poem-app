// Simplified Pulmonary Embolism Severity Index with high-sensitivity troponin T (Aujesky; Lankeit; EE+ 409).
const R = { // [troponin not available, < 14, >= 14] x [score 0, score 1+]
  0: [[1, 'Low risk', '1%', '0.5%', '2.5%'], [4, 'High risk', '8.8%', '7.9%', '14.3%']],
  1: [[1, 'Low risk', '0%', '0%', '0.8%'], [2, 'Moderate risk', '3.8%', '2.5%', '8.2%']],
  2: [[2, 'Moderate risk', '3.8%', '2.5%', '8.2%'], [4, 'High risk', '10.4%', '9.5%', '15.8%']]
};
const ITEMS = [['age', 'Age over 80', 'AGE'], ['cancer', 'History of cancer', 'CANCER'], ['cardiopulmonary', 'History of chronic cardiopulmonary disease', 'COPD'],
  ['pulse', 'Pulse 110 beats/min or higher', 'PULSE'], ['sbp', 'Systolic BP below 100 mm Hg', 'SBP'], ['sao2', 'SaO2 below 90%', 'SAO2']];

module.exports = {
  id: 'spesi-troponin',
  eeId: 409,
  title: 'Simplified PESI, with hs-troponin T',
  subtitle: 'Pulmonary embolism severity index',
  question: 'For a patient diagnosed with acute pulmonary embolism, what is the risk of an adverse outcome or death?',
  inputs: [
    { id: 'troponin', type: 'choice', label: 'High-sensitivity troponin T', ee: 'TROPONIN', options: [{ label: 'Not available' }, { label: 'Below 14 pg/mL' }, { label: '14 pg/mL or higher' }] },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))
  ],
  points: { label: 'sPESI', max: 6 },
  compute(a) {
    const any = ITEMS.some(([id]) => a[id]) ? 1 : 0;
    const r = R[a.troponin][any];
    return { level: r[0], headline: r[1], lines: [{ label: 'Adverse outcome within 30 days', value: r[2] }, { label: 'All-cause death within 30 days', value: r[3] }, { label: 'Death within 6 months', value: r[4] }] };
  }
};
