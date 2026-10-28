// Pulmonary infiltrates in adults with fever or respiratory symptoms (Heckerling 1990; EE+ 8).
const P = [['3%', '1.6%'], ['9.1%', '5.0%'], ['24.2%', '14.4%'], ['50.6%', '34.9%'], ['76.6%', '63.2%'], ['91.3%', '84.6%']];
const { count } = require('../lib');
module.exports = {
  id: 'pneumonia-heckerling',
  eeId: 8,
  title: 'Diagnosis of pneumonia (Heckerling)',
  subtitle: 'Pneumonia in patients with fever or respiratory symptoms',
  question: 'For a patient with fever or respiratory symptoms, what is the probability of pneumonia?',
  inputs: [
    { id: 'temp', type: 'check', label: 'Temperature over 37.8 °C (100.0 °F)', ee: 'IDC_CHECKBOX_1' },
    { id: 'pulse', type: 'check', label: 'Pulse over 100 beats/min', ee: 'IDC_CHECKBOX_2' },
    { id: 'rales', type: 'check', label: 'Rales', ee: 'IDC_CHECKBOX_3' },
    { id: 'dbs', type: 'check', label: 'Decreased breath sounds', ee: 'IDC_CHECKBOX_4' },
    { id: 'noAsthma', type: 'check', label: 'Absence of asthma', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    const n = count(a, ['temp', 'pulse', 'rales', 'dbs', 'noAsthma']), [p28, p19] = P[n];
    return { score: { value: n, max: 5, label: 'Findings' }, level: n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4, headline: `Probability of pneumonia ${p28} given a 28% overall risk`, lines: [{ label: 'Given a 19% overall risk', value: p19 }] };
  }
};
