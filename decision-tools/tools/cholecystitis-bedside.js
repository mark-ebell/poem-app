// Bedside score for acute cholecystitis (Yeh 2019; EE+ 591).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'cholecystitis-bedside',
  eeId: 591,
  title: 'Cholecystitis bedside score (Yeh)',
  subtitle: 'Acute cholecystitis in suspected cases',
  question: 'For a patient with suspected acute cholecystitis, how likely is it?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'stones', type: 'check', label: 'Gallstones (ultrasound)', points: 3, ee: 'cb5' },
    { id: 'murphy', type: 'check', label: "Murphy's sign (clinical or sonographic)", points: 2, ee: 'cb3' },
    { id: 'wall', type: 'check', label: 'Gallbladder wall thickening (ultrasound)', points: 2, ee: 'cb4' },
    { id: 'postprandial', type: 'check', label: 'Post-prandial symptoms', points: 1, ee: 'cb1' },
    { id: 'ruq', type: 'check', label: 'Right upper quadrant tenderness', points: 1, ee: 'cb2' }
  ],
  points: { label: 'Bedside score', max: 9 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 3 ? { level: 1, headline: 'Low risk: 8 of 115 (6.9%) had cholecystitis' } : s <= 5 ? { level: 2, headline: 'Moderate risk: 21 of 42 (50%) had cholecystitis' } : { level: 4, headline: 'High risk: 62 of 70 (89%) had cholecystitis' };
  }
};
