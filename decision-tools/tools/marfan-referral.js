// Marfan syndrome in referred patients (EE+ 483).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'marfan-referral',
  eeId: 483,
  title: 'Marfan syndrome diagnosis',
  subtitle: 'Marfan syndrome in patients referred for evaluation',
  question: 'For a patient referred for evaluation of possible Marfan syndrome, how likely is the diagnosis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'family', type: 'check', label: 'Family history of Marfan syndrome', points: 2, ee: 'FAMILY' },
    { id: 'surgery', type: 'check', label: 'Previous thoracic aortic surgery', points: 1, ee: 'PREVIOUS' },
    { id: 'pectus', type: 'check', label: 'Pectus excavatum', points: 1, ee: 'PECTUS' },
    { id: 'wrist', type: 'check', label: 'Positive wrist and thumb signs', points: 1, ee: 'WRIST',
      note: 'Wrist sign: the thumb overlaps the end of the fifth finger when grasping the other wrist. Thumb sign: the whole thumbnail projects beyond the ulnar border of the clenched fist.' },
    { id: 'pneumo', type: 'check', label: 'History of pneumothorax', points: 1, ee: 'PNEUMO' },
    { id: 'striae', type: 'check', label: 'Striae', points: 1, ee: 'STRIAE' },
    { id: 'ectopia', type: 'check', label: 'Ectopia lentis', points: 4, ee: 'ECTOPIA' }
  ],
  points: { label: 'Score', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 2 ? { level: 1, headline: 'Low risk: 12% had Marfan syndrome' } : s < 4 ? { level: 3, headline: 'Moderate risk: 57% had Marfan syndrome' } : { level: 4, headline: 'High risk: 91% had Marfan syndrome' };
  }
};
