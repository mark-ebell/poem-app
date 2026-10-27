// Success of external cephalic version (Newman 1993; EE+ 257).
const { pointsOf } = require('../lib');
const opts = labels => labels.map((label, points) => ({ label, points }));

const tool = module.exports = {
  id: 'ecv-newman',
  eeId: 257,
  title: 'External cephalic version success (Newman)',
  subtitle: 'Success of external cephalic version for breech',
  question: 'For a woman with a singleton breech pregnancy, how likely is external cephalic version to succeed?',
  inputs: [
    { id: 'parity', type: 'choice', label: 'Parity', ee: 'IDC_COMBOBOX_1', options: opts(['0', '1', '2 or more']) },
    { id: 'dilation', type: 'choice', label: 'Cervical dilation', ee: 'IDC_COMBOBOX_2', options: opts(['3 cm or more', '1 to 2 cm', '0 cm']) },
    { id: 'weight', type: 'choice', label: 'Estimated fetal weight', ee: 'IDC_COMBOBOX_3', options: opts(['Under 2500 g', '2500 to 3500 g', 'Over 3500 g']) },
    { id: 'placenta', type: 'choice', label: 'Placenta', ee: 'IDC_COMBOBOX_4', options: opts(['Anterior', 'Posterior', 'Lateral or fundal']) },
    { id: 'station', type: 'choice', label: 'Station', ee: 'IDC_COMBOBOX_5', options: opts(['−1 or higher', '−2', '−3 or lower']) }
  ],
  points: { label: 'Score', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    const r = s <= 2 ? '0 of 13 (0%)' : s <= 4 ? '10 of 30 (33%)' : s <= 7 ? '113 of 174 (65%)' : s === 8 ? '24 of 30 (80%)' : '19 of 19 (100%)';
    return { headline: `Successful version: ${r}` };
  }
};
