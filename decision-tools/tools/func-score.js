// FUNC score: functional independence 90 days after intracerebral hemorrhage (Rost 2008; EE+ 393).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'func-score',
  eeId: 393,
  title: 'FUNC score',
  subtitle: 'Functional independence 90 days after intracerebral hemorrhage',
  question: 'For a patient admitted with primary intracerebral hemorrhage, how likely is functional independence at 90 days?',
  inputs: [
    { id: 'volume', type: 'choice', label: 'Hemorrhage volume', ee: 'CMB_ICHv', options: [{ label: 'Under 30 cm³', points: 4 }, { label: '30 to 60 cm³', points: 2 }, { label: 'Over 60 cm³', points: 0 }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [{ label: 'Under 70', points: 2 }, { label: '70 to 79', points: 1 }, { label: '80 or older', points: 0 }] },
    { id: 'location', type: 'choice', label: 'Location', ee: 'CMB_ICHl', options: [{ label: 'Lobar', points: 2 }, { label: 'Deep', points: 1 }, { label: 'Infratentorial', points: 0 }] },
    { id: 'gcs', type: 'choice', label: 'Glasgow Coma Scale', ee: 'CHK_GCS', options: [{ label: '9 or more', points: 2 }, { label: '8 or less', points: 0 }] },
    { id: 'cognition', type: 'choice', label: 'Cognitive impairment before the hemorrhage', ee: 'CHK_ImpairedPrior', default: 1, options: [{ label: 'Yes', points: 0 }, { label: 'No', points: 1 }] }
  ],
  points: { label: 'FUNC score', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 4, headline: 'High risk: 0 of 40 (0%) functionally independent at 90 days' }
      : s < 8 ? { level: 3, headline: 'Moderate risk: 12 of 81 (15%) functionally independent at 90 days' }
      : { level: 1, headline: 'Low risk: 50 of 90 (56%) functionally independent at 90 days' };
  }
};
