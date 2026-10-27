// FRACTURE index: 5-year hip fracture risk in women (Black 2001; EE+ 287).
const { pointsOf } = require('../lib');
const NO_BMD = [[1, '0.6%'], [2, '1.4%'], [3, '2.1%'], [4, '3.2%'], [Infinity, '8.2%']];
const BMD = [[2, '0.4%'], [4, '0.9%'], [5, '1.9%'], [7, '3.9%'], [Infinity, '8.7%']];

const tool = module.exports = {
  id: 'fracture-index',
  eeId: 287,
  title: 'Hip fracture risk in women (FRACTURE index)',
  subtitle: '5-year risk of hip fracture in older women',
  question: 'For an older woman, what is the 5-year risk of hip fracture?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [['Under 65', 0], ['65 to 69', 1], ['70 to 74', 2], ['75 to 79', 3], ['80 to 84', 4], ['85 or older', 5]].map(([label, points]) => ({ label, points })) },
    { id: 'tscore', type: 'choice', label: 'Total hip T-score', ee: 'IDC_COMBOBOX_2', options: [['Not available', 0], ['−1 or higher', 0], ['−1 to −2', 2], ['−2 to −2.5', 3], ['Below −2.5', 4]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fracture', type: 'check', label: 'Any fracture after age 50', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'mother', type: 'check', label: 'Maternal hip fracture after age 50', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'weight', type: 'check', label: 'Weight 125 lb (57 kg) or less', points: 1, ee: 'IDC_CHECKBOX_3' },
    { id: 'smoker', type: 'check', label: 'Current smoker', points: 1, ee: 'IDC_CHECKBOX_4' },
    { id: 'arms', type: 'check', label: 'Uses arms to stand up from a chair', points: 2, ee: 'IDC_CHECKBOX_5' }
  ],
  points: { label: 'FRACTURE index' },
  footnote: 'Validated in white women over 65.',
  compute(a) {
    const s = pointsOf(tool, a), bmd = a.tscore > 0;
    const risk = (bmd ? BMD : NO_BMD).find(([max]) => s <= max)[1];
    return { headline: `5-year hip fracture risk: ${risk}`, lines: [bmd ? 'With bone mineral density.' : 'Without bone mineral density.'] };
  }
};
