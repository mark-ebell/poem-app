// Ohmann score for appendicitis (Ohmann 1999; EE+ 372).
const { pointsOf } = require('../lib');
const BANDS = [[4, 'Low risk', '0%'], [6, 'Low risk', '3%'], [8, 'Moderate risk', '10%'], [10, 'Moderate risk', '15%'], [12, 'Moderate risk', '24%'], [14, 'High risk', '38%'], [Infinity, 'High risk', '74%']];

const tool = module.exports = {
  id: 'ohmann',
  eeId: 372,
  title: 'Ohmann score (appendicitis)',
  subtitle: 'Appendicitis in patients over 6 with suspected appendicitis',
  question: 'For a patient over age 6 with suspected appendicitis, how likely is appendicitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'rlq', type: 'check', label: 'Right lower quadrant tenderness', points: 4.5, ee: 'CHK_RLQ' },
    { id: 'rebound', type: 'check', label: 'Rebound tenderness', points: 2.5, ee: 'CHK_Rebound' },
    { id: 'micturition', type: 'check', label: 'No difficulty with micturition', points: 2, ee: 'CHK_Micturition' },
    { id: 'steady', type: 'check', label: 'Steady pain', points: 2, ee: 'CHK_Pain' },
    { id: 'wbc', type: 'check', label: 'White cell count 10,000/µL or more', points: 1.5, ee: 'CHK_Leukocytosis' },
    { id: 'age', type: 'check', label: 'Age under 50', points: 1.5, ee: 'CHK_Age' },
    { id: 'migration', type: 'check', label: 'Migration of pain to the right lower quadrant', points: 1, ee: 'CHK_Migration' },
    { id: 'rigidity', type: 'check', label: 'Abdominal rigidity', points: 1, ee: 'CHK_Abdominal' }
  ],
  points: { label: 'Ohmann score', max: 16 },
  compute(a) {
    const [, label, p] = BANDS.find(([max]) => pointsOf(tool, a) < max);
    return { headline: `${label}: ${p} appendicitis` };
  }
};
