// Maxillary sinusitis (Berg 1988; EE+ 262).
const { count } = require('../lib');
module.exports = {
  id: 'sinusitis-berg',
  eeId: 262,
  title: 'Sinusitis diagnosis (Berg)',
  subtitle: 'Bacterial maxillary sinusitis',
  question: 'For a patient with suspected maxillary sinus infection, what is the probability of bacterial sinusitis?',
  inputs: [
    { id: 'unilatRhin', type: 'check', label: 'Purulent rhinorrhea (worse on one side)', ee: 'IDC_CHECKBOX_1' },
    { id: 'pain', type: 'check', label: 'Local maxillary sinus pain (worse on one side)', ee: 'IDC_CHECKBOX_2' },
    { id: 'bilatRhin', type: 'check', label: 'Bilateral purulent rhinorrhea', ee: 'IDC_CHECKBOX_3' },
    { id: 'pus', type: 'check', label: 'Pus in the nasal cavity on examination', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const n = count(a, ['unilatRhin', 'pain', 'bilatRhin', 'pus']);
    const score = { value: n, max: 4, label: 'Findings' };
    return n <= 1 ? { score, level: 1, headline: '3/70 (4%) with bacterial sinusitis' } : n === 2 ? { score, level: 2, headline: '10/20 (50%) with bacterial sinusitis' } : { score, level: 4, headline: '55/65 (85%) with bacterial sinusitis' };
  }
};
