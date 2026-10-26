// Cerebral venous thrombosis score (Heldner 2020; EE+ 625).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'cvt-score',
  eeId: 625,
  title: 'Cerebral venous thrombosis score',
  subtitle: 'Suspected cerebral venous thrombosis',
  question: 'For an adult with suspected cerebral venous thrombosis, how likely is it?',
  inputs: [
    { type: 'text', text: 'Suspected because of headache with neurologic deficits, impaired consciousness or seizure; papilledema; or an isolated unexpected headache.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'seizure', type: 'check', label: 'Seizures', points: 4, ee: 'cb1' },
    { id: 'thrombophilia', type: 'check', label: 'Known thrombophilia', points: 4, ee: 'cb2' },
    { id: 'ocp', type: 'check', label: 'Oral contraceptive use', points: 2, ee: 'cb3' },
    { id: 'duration', type: 'check', label: 'Symptoms for more than 6 days', points: 2, ee: 'cb4' },
    { id: 'worst', type: 'check', label: 'Worst headache ever', points: 1, ee: 'cb5' },
    { id: 'focal', type: 'check', label: 'Focal neurologic deficits', points: 1, ee: 'cb6' }
  ],
  points: { label: 'Score', max: 14 },
  compute(a) {
    const s = pointsOf(tool, a);
    if (s <= 2) return { level: 1, headline: 'Low risk', lines: ['11 of 186 (5.9%) had cerebral venous thrombosis.'] };
    if (s <= 5) return { level: 2, headline: 'Moderate risk', lines: ['34 of 120 (28.3%) had cerebral venous thrombosis.'] };
    return { level: 4, headline: 'High risk', lines: ['49 of 53 (93%) had cerebral venous thrombosis.'] };
  }
};
