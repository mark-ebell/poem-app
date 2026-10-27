// Glasgow Coma Scale (Teasdale and Jennett 1974; EE+ 114). EE+ called abnormal flexion "decerebrate flexion";
// it is decorticate (abnormal) flexion.
const EYES = ['Spontaneously', 'To speech', 'To pain', 'Never'];
const VERBAL = ['Oriented', 'Confused', 'Inappropriate words', 'Incomprehensible sounds', 'None'];
const MOTOR = ['Obeys commands', 'Localizes pain', 'Withdraws from pain', 'Abnormal flexion (decorticate)', 'Extension (decerebrate)', 'None'];
const opts = (labels, top) => labels.map((label, k) => ({ label: `${label} (${top - k})`, points: top - k }));
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'gcs',
  eeId: 114,
  title: 'Glasgow Coma Scale',
  subtitle: 'Level of consciousness',
  question: 'What is the Glasgow Coma Scale score?',
  inputs: [
    { id: 'eyes', type: 'choice', label: 'Eye opening', ee: 'IDC_COMBOBOX_EYES_OPEN', options: opts(EYES, 4) },
    { id: 'verbal', type: 'choice', label: 'Best verbal response', ee: 'IDC_COMBOBOX_BEST_VERBAL_RESPONSE', options: opts(VERBAL, 5) },
    { id: 'motor', type: 'choice', label: 'Best motor response', ee: 'IDC_COMBOBOX_BEST_MOTOR_RESPONSE', options: opts(MOTOR, 6) }
  ],
  points: { label: 'Glasgow Coma Scale', max: 15 },
  footnote: '3 = worst, 15 = best.',
  compute(a) {
    const s = pointsOf(tool, a);
    return { level: s >= 13 ? 1 : s >= 9 ? 2 : 4, headline: s >= 13 ? 'Mild (13 to 15)' : s >= 9 ? 'Moderate (9 to 12)' : 'Severe (8 or less)' };
  },
  evidence: { reference: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness: a practical scale. Lancet. 1974;2(7872):81-84.', pmid: '4136544', population: null, validation: null, prevalence: null, developed: null, validated: null }
};
