// Osteoporosis Risk Assessment Instrument (ORAI; Cadarette 2000; EE+ 163).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'osteo-orai',
  eeId: 163,
  title: 'Osteoporosis screening (ORAI)',
  subtitle: 'Osteoporosis Risk Assessment Instrument for postmenopausal women',
  question: 'For a postmenopausal woman, is bone density testing indicated?',
  inputs: [
    { id: 'weight', type: 'choice', label: 'Weight', ee: 'IDC_COMBOBOX_1', options: [['Under 60 kg (under 132 lb)', 9], ['60 to 70 kg (132 to 154 lb)', 3], ['Over 70 kg (over 154 lb)', 0]].map(([label, points]) => ({ label, points })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_2', options: [['Under 55', 0], ['55 to 64', 5], ['65 to 74', 10], ['75 or older', 15]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check if present' },
    { id: 'noEstrogen', type: 'check', label: 'Not currently taking estrogen', points: 2, ee: 'IDC_CHECKBOX_1' }
  ],
  points: { label: 'ORAI score', max: 26 },
  footnote: 'For a T-score below −2 SD: LR+ 1.4, LR− 0.18.',
  compute(a) {
    return pointsOf(tool, a) >= 9 ? { level: 3, headline: 'Bone density screening indicated' } : { level: 1, headline: 'Bone density screening not indicated' };
  }
};
