// 30-day prognosis of acute PE in patients with cancer (den Exter; EE+ 506).
module.exports = {
  id: 'pe-cancer-prognosis',
  eeId: 506,
  title: 'Pulmonary embolism prognosis in cancer',
  subtitle: '30-day mortality and adverse events with acute PE and active cancer',
  question: 'For a patient with active cancer and acute symptomatic pulmonary embolism, what is the 30-day prognosis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'metastases', type: 'check', label: 'Metastases', points: 4, ee: 'METASTASES' },
    { id: 'immobile', type: 'check', label: 'Immobility (bedridden 4 or more days, with only bathroom privileges, in the last 2 months)', points: 2, ee: 'IMMOBILE' },
    { id: 'age', type: 'check', label: 'Age over 80', points: 1, ee: 'AGE' },
    { id: 'hr', type: 'check', label: 'Heart rate above 110 beats/min', points: 1, ee: 'HR' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 100 mm Hg', points: 1, ee: 'SBP' },
    { id: 'weight', type: 'check', label: 'Body weight below 60 kg (132 lb)', points: 1, ee: 'WEIGHT' }
  ],
  points: { label: 'Score', max: 10 },
  compute(a) {
    const s = 4 * a.metastases + 2 * a.immobile + a.age + a.hr + a.sbp + a.weight;
    const r = s < 2 ? [1, 'Low risk', '0 of 47 (0%)', '2 of 47 (4.2%)'] : s < 5 ? [2, 'Moderate risk', '15 of 135 (13%)', '23 of 115 (20%)'] : [4, 'High risk', '27 of 99 (27%)', '30 of 99 (30%)'];
    return { level: r[0], headline: r[1], lines: [{ label: '30-day mortality', value: r[2] }, { label: 'Adverse events', value: r[3] }] };
  }
};
