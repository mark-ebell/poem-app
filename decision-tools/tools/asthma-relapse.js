// Relapse after ED treatment of asthma in adults (McCarren 1998; EE+ 155).
const RISK = ['14%', '38%', '63%', '100%'];
const { count } = require('../lib');
module.exports = {
  id: 'asthma-relapse',
  eeId: 155,
  title: 'Asthma relapse in adults',
  subtitle: 'Relapse within 8 weeks after an ED visit for asthma',
  question: 'For an adult seen in the ED for asthma, what is the risk of relapse over the next 8 weeks?',
  inputs: [
    { id: 'visits', type: 'check', label: '3 or more ED visits in the past 6 months', ee: 'IDC_CHECKBOX_1' },
    { id: 'function', type: 'check', label: 'Difficulty performing work or other activities because of physical health in the past 6 months', ee: 'IDC_CHECKBOX_2' },
    { id: 'left', type: 'check', label: 'Left before 24 hours without reaching 50% of predicted peak expiratory flow', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const n = count(a, ['visits', 'function', 'left']);
    return { score: { value: n, max: 3, label: 'Risk factors' }, level: n + 1, headline: `${RISK[n]} risk of relapse over 8 weeks` };
  }
};
