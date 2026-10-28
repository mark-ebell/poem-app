// Healing of venous leg ulcers with compression (Margolis 2000; EE+ 143).
const { count } = require('../lib');
module.exports = {
  id: 'leg-ulcer-margolis',
  eeId: 143,
  title: 'Venous leg ulcer healing',
  subtitle: 'Healing with limb compression bandages',
  question: 'What is the probability that a venous leg ulcer will heal by 24 weeks with limb compression bandages?',
  inputs: [
    { id: 'area', type: 'check', label: 'Wound area over 5 cm² (measured with a template)', ee: 'IDC_CHECKBOX_1' },
    { id: 'old', type: 'check', label: 'Wound age over 6 months', ee: 'IDC_CHECKBOX_2' }
  ],
  compute(a) {
    const n = count(a, ['area', 'old']);
    return [{ level: 1, headline: '95% healed by 24 weeks (validation group)' }, { level: 2, headline: '73% healed by 24 weeks (validation group)' }, { level: 4, headline: '13% healed by 24 weeks in the derivation group, 37% in the validation group' }][n];
  }
};
