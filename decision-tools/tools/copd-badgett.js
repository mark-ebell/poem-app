// Obstructive airway disease in high-risk adults (Badgett 1994; EE+ 275).
const P = ['3%', '24%', '39%', '49%'];
const { count } = require('../lib');
module.exports = {
  id: 'copd-badgett',
  eeId: 275,
  title: 'COPD diagnosis',
  subtitle: 'Obstructive airway disease in adults over 40',
  question: 'For an adult over 40 at risk, what is the probability of COPD?',
  inputs: [
    { id: 'pef', type: 'check', label: 'Peak flow under 350 L/min', ee: 'IDC_CHECKBOX_1' },
    { id: 'breath', type: 'check', label: 'Definitely or possibly diminished breath sounds', ee: 'IDC_CHECKBOX_2' },
    { id: 'packs', type: 'check', label: '30 or more pack-years of smoking', ee: 'IDC_CHECKBOX_3' }
  ],
  footnote: 'Not prospectively validated.',
  compute(a) {
    const n = count(a, ['pef', 'breath', 'packs']);
    return { score: { value: n, max: 3, label: 'Findings' }, level: n + 1, headline: `${P[n]} with COPD` };
  }
};
