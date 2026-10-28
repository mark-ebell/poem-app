// Syracuse croup score (validated by Shortland 1994; EE+ 261). Respiratory rate and pulse bands depend on
// weight and age, as on EE+.
const band = (labels, ee, when) => ({ type: 'choice', ee, when, options: labels.map((label, points) => ({ label, points })) });
const RR = [['Under 35', '36 to 40', '41 to 45', 'Over 45'], ['Under 30', '31 to 35', '36 to 40', 'Over 40'], ['Under 20', '21 to 24', '25 to 30', 'Over 30']];
const HR = [['Under 150', '150 to 165', '166 to 190', 'Over 190'], ['Under 130', '130 to 145', '146 to 170', 'Over 170'], ['Under 120', '120 to 135', '136 to 150', 'Over 150'], ['Under 110', '110 to 125', '126 to 140', 'Over 140'], ['Under 90', '91 to 100', '101 to 120', 'Over 120']];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'croup-syracuse',
  eeId: 261,
  title: 'Croup score (Syracuse)',
  subtitle: 'Risk of intubation in children admitted with croup',
  question: 'For a child admitted with croup, is the risk of intubation high? (Recalculate the score every shift.)',
  inputs: [
    { id: 'stridor', type: 'choice', label: 'Stridor', ee: 'IDC_COMBOBOX_1', options: ['None', 'Faintly audible', 'Easily audible'].map((label, points) => ({ label, points })) },
    { id: 'cyanosis', type: 'choice', label: 'Cyanosis', ee: 'IDC_COMBOBOX_2', options: ['None', 'Minimal', 'Obvious'].map((label, points) => ({ label, points })) },
    { id: 'retraction', type: 'choice', label: 'Sternal retraction', ee: 'IDC_COMBOBOX_3', options: ['None', 'Present'].map((label, points) => ({ label, points })) },
    { id: 'weight', type: 'choice', label: 'Weight', ee: 'IDC_COMBOBOX_4', options: [{ label: '5 kg or less' }, { label: '5.1 to 10 kg' }, { label: 'Over 10 kg' }] },
    ...RR.map((labels, w) => ({ id: `rr${w}`, label: 'Respiratory rate (breaths/min)', ...band(labels, 'IDC_COMBOBOX_5', a => a.weight === w) })),
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_6', options: [{ label: 'Under 3 months' }, { label: '3 to 6 months' }, { label: '7 to 12 months' }, { label: '1 to 3 years' }, { label: '4 to 5 years' }] },
    ...HR.map((labels, k) => ({ id: `hr${k}`, label: 'Pulse (beats/min)', ...band(labels, 'IDC_COMBOBOX_7', a => a.age === k) }))
  ],
  points: { label: 'Croup score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s > 5 ? { level: 4, headline: 'High risk of intubation (score over 5)' } : { level: 1, headline: 'Low risk of intubation (score 5 or less: 1.8%)' };
  }
};
