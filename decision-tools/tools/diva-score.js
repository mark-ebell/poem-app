// DIVA score: difficult IV access in children (Yen 2008; EE+ 470).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'diva-score',
  eeId: 470,
  title: 'Difficult IV access in children (DIVA score)',
  subtitle: 'Failed first attempt at peripheral IV placement in children',
  question: 'For a child needing a peripheral IV, how likely is the first attempt to fail?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '36 months or older', points: 0 }, { label: '12 to 35 months', points: 1 }, { label: 'Under 12 months', points: 3 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'visible', type: 'check', label: 'Vein not visible after tourniquet', points: 2, ee: 'VISIBLE' },
    { id: 'palpable', type: 'check', label: 'Vein not palpable after tourniquet', points: 2, ee: 'PALPABLE' },
    { id: 'prem', type: 'check', label: 'Born prematurely (under 38 weeks)', points: 3, ee: 'PREM' }
  ],
  points: { label: 'DIVA score', max: 10 },
  compute(a) {
    return pointsOf(tool, a) < 4 ? { level: 1, headline: 'Low likelihood of difficult IV placement (LR− 0.5)' } : { level: 3, headline: 'High likelihood of difficult IV placement (LR+ 2.2)' };
  }
};
