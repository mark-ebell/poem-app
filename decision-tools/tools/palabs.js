// PALabS score: children at low risk of appendicitis (Benito 2020; EE+ 631).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'palabs',
  eeId: 631,
  title: 'PALabS score (appendicitis in children)',
  subtitle: 'Low risk of appendicitis in children 2 to 14',
  question: 'For a child aged 2 to 14 with suspected appendicitis, how likely is appendicitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'anc', type: 'check', label: 'Absolute neutrophil count 7,500/µL or more', points: 7, ee: 'cb4' },
    { id: 'rlq', type: 'check', label: 'Maximal pain in the right lower quadrant', points: 4, ee: 'cb2' },
    { id: 'wbc', type: 'check', label: 'White cell count 10,000/µL or more', points: 4, ee: 'cb3' },
    { id: 'nausea', type: 'check', label: 'Nausea', points: 3, ee: 'cb1' },
    { id: 'calprotectin', type: 'check', label: 'Calprotectin 0.50 ng/mL or more', points: 3, ee: 'cb6' },
    { id: 'crp', type: 'check', label: 'C-reactive protein 1.0 mg/dL or more', points: 2, ee: 'cb5' }
  ],
  points: { label: 'PALabS score', max: 23 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 7 ? { level: 1, headline: 'Low risk: 7 of 121 (5.7%) had appendicitis' } : s <= 18 ? { level: 2, headline: 'Moderate risk: 83 of 254 (33%) had appendicitis' } : { level: 4, headline: 'High risk: 135 of 156 (86%) had appendicitis' };
  }
};
