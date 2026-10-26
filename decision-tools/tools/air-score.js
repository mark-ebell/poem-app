// Appendicitis Inflammatory Response (AIR) score (validation: de Castro 2012; EE+ 594).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'air-score',
  eeId: 594,
  title: 'AIR score (appendicitis)',
  subtitle: 'Appendicitis Inflammatory Response score, adults and children',
  question: 'For a patient of any age with suspected appendicitis, how likely is appendicitis?',
  inputs: [
    { id: 'peritonism', type: 'choice', label: 'Rebound tenderness or guarding', ee: 'ddl1', options: ['None', 'Light', 'Medium', 'Strong'].map((label, points) => ({ label, points })) },
    { id: 'pmn', type: 'choice', label: 'Neutrophils (polymorphonuclear leukocytes)', ee: 'ddl2', options: ['Under 70%', '70% to 84%', '85% or more'].map((label, points) => ({ label, points })) },
    { id: 'wbc', type: 'choice', label: 'White cell count', ee: 'ddl3', options: ['Under 10 × 10⁹/L', '10 to 14.9', '15.0 or more'].map((label, points) => ({ label, points })) },
    { id: 'crp', type: 'choice', label: 'C-reactive protein', ee: 'ddl4', options: ['Under 10 mg/L', '10 to 49 mg/L', '50 mg/L or more'].map((label, points) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', points: 1, ee: 'cb1' },
    { id: 'rlq', type: 'check', label: 'Pain in the right lower quadrant', points: 1, ee: 'cb2' },
    { id: 'temp', type: 'check', label: 'Temperature above 38.5°C', points: 1, ee: 'cb3' }
  ],
  points: { label: 'AIR score', max: 12 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 4 ? { level: 1, headline: 'Low risk: 25 of 533 (4.7%) had appendicitis' } : s <= 8 ? { level: 3, headline: 'Moderate risk: 285 of 372 (77%) had appendicitis' } : { level: 4, headline: 'High risk: 36 of 36 (100%) had appendicitis' };
  }
};
