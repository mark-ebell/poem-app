// AWOL score: delirium in hospitalized patients (Douglas 2013; EE+ 574). Wording as in EE+.
module.exports = {
  id: 'awol',
  eeId: 574,
  title: 'Inpatient delirium risk (AWOL score)',
  subtitle: 'Delirium during hospitalization',
  question: 'For a patient admitted without delirium, what is the risk of developing delirium in hospital?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 80', ee: 'cb1' },
    { id: 'world', type: 'check', label: 'Unable to spell WORLD backwards', ee: 'cb2' },
    { id: 'orientation', type: 'check', label: 'Disoriented (does not know the state, county, city, hospital and floor)', ee: 'cb3' },
    { id: 'illness', type: 'check', label: "Moderate or severe illness (admitting nurse's rating: not, mildly, moderately or severely ill)", ee: 'cb4' }
  ],
  compute(a) {
    const n = a.age + a.world + a.orientation + a.illness;
    return n <= 1 ? { score: { value: n, max: 4, label: 'AWOL score' }, level: 1, headline: 'Low risk of developing delirium: 10 of 261 (3.8%)', lines: ['Reassess in 2 to 3 days or if clinically warranted.'] }
      : { score: { value: n, max: 4, label: 'AWOL score' }, level: 3, headline: 'High risk of developing delirium: 10 of 40 (25%)', lines: ['Institute an anti-delirium protocol such as CAM.'] };
  }
};
