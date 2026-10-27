// Apgar score (EE+ 118).
const { pointsOf } = require('../lib');
const item = (id, label, ee, labels) => ({ id, type: 'choice', label, ee, options: labels.map((l, k) => ({ label: l, points: 2 - k })) });

const tool = module.exports = {
  id: 'apgar',
  eeId: 118,
  title: 'Apgar score',
  subtitle: 'Newborn condition at 1 and 5 minutes',
  question: 'What is the Apgar score for this newborn?',
  inputs: [
    item('hr', 'Heart rate', 'IDC_COMBOBOX_1', ['100/min or more', 'Under 100/min', 'Absent']),
    item('resp', 'Respiratory effort', 'IDC_COMBOBOX_2', ['Good, crying', 'Slow or irregular', 'Absent']),
    item('tone', 'Muscle tone', 'IDC_COMBOBOX_3', ['Active motion', 'Some flexion of the limbs', 'Limp']),
    item('reflex', 'Reflex irritability', 'IDC_COMBOBOX_4', ['Cough, sneeze or cry', 'Grimace', 'No response']),
    item('color', 'Color', 'IDC_COMBOBOX_5', ['Completely pink', 'Blue extremities', 'Blue or pale all over'])
  ],
  points: { label: 'Apgar score', max: 10 },
  compute(a) {
    return { headline: `Apgar score: ${pointsOf(tool, a)}` };
  },
  evidence: { reference: 'Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267.' }
};
