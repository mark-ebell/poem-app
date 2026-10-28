// Death or vegetative state after pediatric submersion (Graf 1995; EE+ 22). Results as on EE+.
module.exports = {
  id: 'drowning-graf',
  eeId: 22,
  title: 'Prognosis in near drowning',
  subtitle: 'Death or vegetative state in pediatric submersion',
  question: 'For a child admitted after submersion, what is the likelihood of death or a vegetative state?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'CMB_Gender', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'glucose', type: 'number', label: 'Serum glucose', unit: 'mg/dL', min: 10, max: 1500, ee: 'IDC_EDIT_1' },
    { id: 'pupils', type: 'check', label: 'Pupillary reflex present', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const p = 1 / (1 + Math.exp(6.38 - 4.23 * (a.pupils ? 0 : 1) - 0.01 * a.glucose - 2.3 * (a.sex === 0 ? 1 : 0)));
    return p >= 0.95 ? { level: 4, headline: 'Likelihood of death or vegetative state: 100%' } : { level: 2, headline: 'Likelihood of death or vegetative state: 50%' };
  }
};
