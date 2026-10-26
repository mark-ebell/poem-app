// Complications requiring intensive care in acute chest pain (Goldman/Lee; EE+ 21).
const RISKS = { // by risk class 1 (highest) .. 4: [<12 h, 12-24 h, 24-48 h, 48-72 h, overall]
  1: [7.6, 3.4, 3.2, 2.9, 16.1], 2: [1.1, 2.2, 2.7, 2.1, 7.8], 3: [0.5, 1.2, 1.1, 1.1, 3.9], 4: [0.2, 0.2, 0.2, 0, 0.6]
};

module.exports = {
  id: 'icu-complications',
  eeId: 21,
  title: 'Complications requiring intensive care in chest pain',
  subtitle: 'Goldman/Lee risk classes',
  question: 'Which patients with acute chest pain will have complications requiring intensive care?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 110 mm Hg', ee: 'SYSTOLIC' },
    { id: 'rales', type: 'check', label: 'Rales heard above the bases bilaterally', ee: 'PE' },
    { id: 'unstable', type: 'check', label: 'Known unstable ischemic heart disease', ee: 'DISEASE' },
    { id: 'mi', type: 'check', label: 'Suspected MI on ECG (ST elevation of 1 mm or more, or pathologic Q waves, in more than 1 lead, not known to be old)', ee: 'SUSPECTED' },
    { id: 'ischemia', type: 'check', label: 'Suspected ischemia on ECG (ST depression of 1 mm or more, or T-wave inversion, in more than 1 lead, not known to be old)', ee: 'ISCHEMIA' }
  ],
  compute(a) {
    const factors = [a.sbp, a.rales, a.unstable].filter(Boolean).length;
    const cls = a.mi ? 1 : a.ischemia ? (factors >= 2 ? 1 : 2) : [4, 3, 2, 2][factors];
    const r = RISKS[cls];
    return {
      level: 5 - cls,
      headline: `Risk class ${cls} of 4`,
      lines: [{ label: 'Complications requiring intensive care (overall)', value: `${r[4]}%` },
        { label: 'Within 12 hours', value: `${r[0]}%` }, { label: '12 to 24 hours', value: `${r[1]}%` },
        { label: '24 to 48 hours', value: `${r[2]}%` }, { label: '48 to 72 hours', value: `${r[3]}%` }]
    };
  }
};
