// LOCH score: hospitalization of COVID-19 outpatients during Omicron (Ebell 2023; EE+ 637).
module.exports = {
  id: 'covid-loch',
  eeId: 637,
  title: 'LOCH score (COVID-19 outpatients)',
  subtitle: 'Hospitalization of outpatients with COVID-19 during the Omicron period',
  question: 'For an adult outpatient diagnosed with COVID-19, what is the risk of hospitalization?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', options: [{ label: '18 to 49' }, { label: '50 to 59' }, { label: '60 to 69' }, { label: '70 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dyspnea', type: 'check', label: 'Dyspnea', ee: 'chkDyspnea' },
    { id: 'comorbid', type: 'check', label: 'Comorbidity (diabetes, asthma, COPD, cancer, hypertension, cardiovascular disease, or chronic kidney or liver disease)', ee: 'chkComorbid' },
    { id: 'vax', type: 'check', label: 'Vaccinated (2 or more Moderna or Pfizer doses, or 1 or more Janssen)', ee: 'chkVax' }
  ],
  compute(a) {
    const s = [0, 1, 1.5, 2.5][a.age] + 1.5 * a.dyspnea + a.comorbid;
    const g = s === 0 ? 0 : s <= 2.5 ? 1 : 2;
    const out = a.vax
      ? [[1, 'Very low risk', '2 of 3138 (0.06%)'], [1, 'Low risk', '13 of 4822 (0.27%)'], [3, 'Moderate risk', '54 of 1577 (3.4%)']]
      : [[1, 'Low risk', '6 of 5300 (0.11%)'], [2, 'Moderate risk', '68 of 4045 (1.7%)'], [4, 'High risk', '51 of 574 (8.9%)']];
    const [level, label, p] = out[g];
    return { score: { value: s, label: 'Score' }, level, headline: `${label}: ${p} hospitalized` };
  }
};
