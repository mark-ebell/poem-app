// Peripheral arterial disease: long-term mortality (Feringa 2007; EE+ 413).
const ITEMS = [ // id, label, EE+ id, points for 1-, 5- and 10-year mortality
  ['age', 'Age over 65 years', 'CHK_Age', 15, 7, 5],
  ['renal', 'Renal dysfunction (creatinine above 2.0 mg/dL or 177 µmol/L)', 'CHK_Renal', 15, 15, 12],
  ['chol', 'Hypercholesterolemia (above 212 mg/dL or 5.5 mmol/L)', 'CHK_Hyperchol', 13, 5, 5],
  ['hf', 'History of heart failure', 'CHK_HF', 9, 8, 7],
  ['abi', 'Ankle-brachial index below 0.6', 'CHK_Ankle', 8, 7, 4],
  ['q', 'Q waves on ECG', 'CHK_QWaves', 7, 3, 4],
  ['dm', 'Diabetes mellitus', 'CHK_DM', 6, 4, 3],
  ['bb', 'Beta-blocker use', 'CHK_BetaBlocker', -6, -4, -4],
  ['asa', 'Aspirin use', 'CHK_Aspirin', -8, -7, -4],
  ['statin', 'Statin use', 'CHK_Statin', -18, -6, -6],
  ['cva', 'History of cerebrovascular events', 'CHK_Cerebro', 0, 7, 3],
  ['st', 'ST-segment changes on ECG', 'CHK_ST', 0, 5, 5],
  ['copd', 'Chronic obstructive pulmonary disease', 'CHK_COPD', 0, 0, 3]
];
const BANDS = [ // [score cut-offs (below), mortality %] for 1, 5 and 10 years
  [[1, 14, 23], ['0.9', '4.7', '9.1', '14.7']],
  [[1, 8, 15], ['7.7', '18.2', '28.9', '45.0']],
  [[1, 8, 15], ['21.4', '28.9', '46.1', '66.4']]
];

module.exports = {
  id: 'pad-prognosis',
  eeId: 413,
  title: 'Peripheral arterial disease prognosis (Feringa)',
  subtitle: '1-, 5- and 10-year mortality',
  question: 'For a patient with peripheral arterial disease (ankle-brachial index below 0.9), what is the risk of death over 1, 5 and 10 years?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  footnote: 'The last three items (cerebrovascular events, ST changes and COPD) do not count toward 1-year mortality; COPD counts only toward 10-year mortality.',
  compute(a) {
    const p = [0, 1, 2].map(k => {
      const s = ITEMS.reduce((t, it) => t + (a[it[0]] ? it[3 + k] : 0), 0);
      const [cuts, probs] = BANDS[k];
      const i = cuts.findIndex(c => s < c);
      return { s, i: i < 0 ? 3 : i, prob: probs[i < 0 ? 3 : i] };
    });
    return {
      level: p[1].i + 1,
      headline: `5-year mortality: ${p[1].prob}%`,
      table: { head: ['Mortality at', 'Points', 'Mortality'], rows: [['1 year', String(p[0].s), `${p[0].prob}%`], ['5 years', String(p[1].s), `${p[1].prob}%`], ['10 years', String(p[2].s), `${p[2].prob}%`]] }
    };
  }
};
