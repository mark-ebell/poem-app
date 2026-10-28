// Prolonged nursing home stay after hip fracture (Steiner 1997; EE+ 258).
const P = ['0% (n=30)', '2.4% (n=85)', '2.6% (n=77)', '15.4% (n=39)', '50.0% (n=8)'];
const { count } = require('../lib');
module.exports = {
  id: 'hip-fracture-nh-stay',
  eeId: 258,
  title: 'Hip fracture length of stay in NH',
  subtitle: 'Still in a nursing home 6 months after hip fracture',
  question: 'For a patient admitted to a nursing home after hip fracture, what is the risk of still being there at 6 months?',
  inputs: [
    { id: 'incontinence', type: 'check', label: 'Bowel or bladder incontinence', ee: 'IDC_CHECKBOX_2' },
    { id: 'cognitive', type: 'check', label: 'Cognitive impairment (Mini-Mental State score under 24)', ee: 'IDC_CHECKBOX_3' },
    { id: 'ambulation', type: 'check', label: 'Dependent for ambulation', ee: 'IDC_CHECKBOX_4' },
    { id: 'unmarried', type: 'check', label: 'Unmarried', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const n = count(a, ['incontinence', 'cognitive', 'ambulation', 'unmarried']);
    return { score: { value: n, max: 4, label: 'Risk factors' }, level: n <= 2 ? 1 : n === 3 ? 3 : 4, headline: `${P[n]} still in the nursing home at 6 months` };
  }
};
