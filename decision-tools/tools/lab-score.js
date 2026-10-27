// Lab-score: serious bacterial infection in young children with fever without source (Galetto-Lacour 2008; EE+ 457).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'lab-score',
  eeId: 457,
  title: 'Serious bacterial infection in fever without source (Lab-score)',
  subtitle: 'Serious bacterial infection in children 7 days to 36 months',
  question: 'For a child 7 days to 36 months with fever without a source, how likely is a serious bacterial infection?',
  inputs: [
    { id: 'pct', type: 'choice', label: 'Procalcitonin', ee: 'PCT', options: [{ label: 'Under 0.5 ng/mL', points: 0 }, { label: '0.5 to 1.99', points: 2 }, { label: '2.0 or more', points: 4 }] },
    { id: 'crp', type: 'choice', label: 'C-reactive protein', ee: 'CRP', options: [{ label: 'Under 40 mg/L', points: 0 }, { label: '40 to 99', points: 2 }, { label: '100 or more', points: 4 }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'urine', type: 'check', label: 'Urine dipstick positive for leukocyte esterase or nitrite', points: 1, ee: 'URINE' }
  ],
  points: { label: 'Lab-score', max: 9 },
  footnote: 'Probabilities assume a baseline risk of serious bacterial infection of 23%.',
  compute(a) {
    return pointsOf(tool, a) < 3 ? { level: 1, headline: 'Negative Lab-score (under 3): LR− 0.17, 5% probability of serious bacterial infection' }
      : { level: 4, headline: 'Positive Lab-score (3 or more): LR+ 5.1, 60% probability of serious bacterial infection' };
  }
};
