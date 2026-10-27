// Outcome after severe head injury in children from the Glasgow Coma Scale and its trend (Grewal 1991; EE+ 115).
const EYES = ['Spontaneously', 'To speech', 'To pain', 'Never'];
const VERBAL = ['Oriented', 'Confused', 'Inappropriate words', 'Incomprehensible sounds', 'None'];
const MOTOR = ['Obeys commands', 'Localizes pain', 'Withdraws from pain', 'Abnormal flexion (decorticate)', 'Extension (decerebrate)', 'None'];
const opts = (labels, top) => labels.map((label, k) => ({ label: `${label} (${top - k})`, points: top - k }));
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'peds-head-gcs',
  eeId: 115,
  title: 'Pediatric head injury prognosis (GCS trend)',
  subtitle: 'Outcome after severe head injury in children',
  question: 'For a child admitted with a severe head injury, what outcome is likely from the Glasgow Coma Scale on admission and its trend over 24 hours?',
  inputs: [
    { type: 'heading', label: 'Glasgow Coma Scale on admission' },
    { id: 'eyes', type: 'choice', label: 'Eye opening', ee: 'IDC_COMBOBOX_EYES_OPEN', options: opts(EYES, 4) },
    { id: 'verbal', type: 'choice', label: 'Best verbal response', ee: 'IDC_COMBOBOX_BEST_VERBAL_RESPONSE', options: opts(VERBAL, 5) },
    { id: 'motor', type: 'choice', label: 'Best motor response', ee: 'IDC_COMBOBOX_BEST_MOTOR_RESPONSE', options: opts(MOTOR, 6) },
    { type: 'heading', label: 'Check if present' },
    { id: 'worse', type: 'check', label: 'Glasgow Coma Scale worse 24 hours later', ee: 'IDC_CHECKBOX_GCS_WORSE_24_H_LATER' }
  ],
  points: { label: 'Glasgow Coma Scale', max: 15 },
  footnote: 'From a study of 95 children.',
  compute(a) {
    if (pointsOf(tool, a) < 5) return { level: 4, headline: '8 deaths, 1 moderate disability, 2 good recoveries' };
    return a.worse ? { level: 3, headline: '3 deaths, 1 severe disability, 6 good recoveries' } : { level: 1, headline: 'No deaths, 1 severe disability, 73 good recoveries' };
  }
};
