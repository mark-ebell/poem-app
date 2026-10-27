// Bishop score, with induction outcomes from Dhall 1987 (EE+ 38).
const { pointsOf } = require('../lib');
const opts = labels => labels.map((label, points) => ({ label, points }));

const tool = module.exports = {
  id: 'bishop',
  eeId: 38,
  title: 'Bishop score (induction of labor)',
  subtitle: 'Cervical favorability before induction of labor',
  question: 'Before induction of labor, how favorable is the cervix, and how likely is a successful induction?',
  inputs: [
    { id: 'dilation', type: 'choice', label: 'Dilation', ee: 'IDC_COMBOBOX_1', options: opts(['Closed', '1 to 2 cm', '3 to 4 cm', '5 cm or more']) },
    { id: 'effacement', type: 'choice', label: 'Effacement', ee: 'IDC_COMBOBOX_3', options: opts(['0% to 30%', '40% to 50%', '60% to 70%', 'Over 70%']) },
    { id: 'station', type: 'choice', label: 'Station', ee: 'IDC_COMBOBOX_2', options: opts(['−3', '−2', '−1 or 0', '+1 or +2']) },
    { id: 'consistency', type: 'choice', label: 'Consistency', ee: 'IDC_COMBOBOX_5', options: opts(['Firm', 'Medium', 'Soft']) },
    { id: 'position', type: 'choice', label: 'Position', ee: 'IDC_COMBOBOX_4', options: opts(['Posterior', 'Middle', 'Anterior']) }
  ],
  points: { label: 'Bishop score', max: 13 },
  compute(a) {
    const s = pointsOf(tool, a);
    const [hours, p] = s <= 3 ? ['19.4', '47%'] : s <= 5 ? ['15.9', '68%'] : ['9.4', '92%'];
    return { headline: `Likelihood of successful induction: ${p}`, lines: [`Mean duration of labor: ${hours} hours`] };
  }
};
