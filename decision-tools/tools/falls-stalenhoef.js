// Recurrent falls in community-dwelling older adults (Stalenhoef 2002; EE+ 230).
const { count } = require('../lib');
module.exports = {
  id: 'falls-stalenhoef',
  eeId: 230,
  title: 'Fall risk in elderly',
  subtitle: 'Recurrent falls in community-dwelling adults over 70',
  question: 'For a community-dwelling adult over 70, what is the risk of recurrent falls?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'age80', type: 'check', label: 'Age 80 years or older', ee: 'IDC_CHECKBOX_1' },
    { id: 'depressed', type: 'check', label: 'Depressed (positive screening test)', ee: 'IDC_CHECKBOX_3' },
    { id: 'falls', type: 'check', label: '2 or more falls in the previous year', ee: 'IDC_CHECKBOX_2' },
    { id: 'sway', type: 'check', label: 'Abnormal postural sway', ee: 'IDC_CHECKBOX_5' },
    { id: 'weak', type: 'check', label: 'Weak handgrip (22 kg or less in men, 12 kg or less in women, by dynamometer)', ee: 'IDC_CHECKBOX_4' }
  ],
  footnote: 'Not prospectively validated. "Recurrent" means 2 or more falls in the 36-week study period.',
  compute(a) {
    const n = count(a, ['falls', 'depressed', 'weak', 'sway']);
    const x = -2.28 - 0.39 * a.sex + 0.04 * a.age80 + 1.14 * a.falls + 0.78 * a.depressed + 1.14 * a.weak + 1.36 * a.sway;
    const p = Math.round(1000 / (1 + Math.exp(-x))) / 10;
    const [level, r] = n <= 1 ? [1, 'Low'] : n === 2 ? [2, 'Moderate'] : [3, 'High'];
    return { level, headline: `${r} risk of recurrent falls (${p}%)` };
  }
};
