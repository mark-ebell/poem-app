// Mortality after burn injury (Ryan 1998; EE+ 121).
const M = ['0.7%', '14%', '39%', '90%'];
const { count } = require('../lib');
module.exports = {
  id: 'burn-ryan',
  eeId: 121,
  title: 'Burn injury prognosis',
  subtitle: 'Mortality from burn injuries (Ryan)',
  question: 'For a patient with burns, what is the risk of death?',
  inputs: [
    { id: 'age', type: 'check', label: 'Age over 60 years', ee: 'IDC_CHECKBOX_1' },
    { id: 'bsa', type: 'check', label: 'Burn covering more than 40% of body surface area', ee: 'IDC_CHECKBOX_2' },
    { id: 'inhal', type: 'check', label: 'Inhalation injury', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const n = count(a, ['age', 'bsa', 'inhal']);
    return { score: { value: n, max: 3, label: 'Risk factors' }, level: n + 1, headline: `Mortality ${M[n]}` };
  }
};
