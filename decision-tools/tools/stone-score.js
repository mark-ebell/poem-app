// STONE score for uncomplicated ureteral stone (Moore 2014; EE+ 511).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'stone-score',
  eeId: 511,
  title: 'Ureteral stone diagnosis (STONE score)',
  subtitle: 'Probability of a ureteral stone',
  question: 'For a patient with a suspected uncomplicated kidney stone, what is the probability of a ureteral stone?',
  inputs: [
    { id: 'male', type: 'check', label: 'Male sex', points: 2, ee: 'MALE' },
    { id: 'nonBlack', type: 'check', label: 'Non-Black race', points: 3, ee: 'RACE' },
    { id: 'hematuria', type: 'check', label: 'Hematuria on urine dipstick', points: 3, ee: 'HEMA' },
    { id: 'duration', type: 'choice', label: 'Duration of pain to presentation', ee: 'DURATION', options: [{ label: 'Less than 6 hours', points: 3 }, { label: '6 to 24 hours', points: 1 }, { label: 'More than 24 hours', points: 0 }] },
    { id: 'nausea', type: 'choice', label: 'Nausea or vomiting', ee: 'NAUSEA', options: [{ label: 'None', points: 0 }, { label: 'Nausea alone', points: 1 }, { label: 'Vomiting', points: 2 }] }
  ],
  points: { label: 'STONE score', max: 13 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 6 ? { level: 1, headline: 'Low risk: 9.2% with ureteral stone' } : s < 10 ? { level: 2, headline: 'Moderate risk: 51.3% with ureteral stone' } : { level: 4, headline: 'High risk: 88.6% with ureteral stone' };
  }
};
