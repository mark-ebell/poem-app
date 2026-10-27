// Male Osteoporosis Risk Estimation Score (MORES; Shepherd 2007; EE+ 377).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'osteo-mores',
  eeId: 377,
  title: 'Osteoporosis risk in men (MORES)',
  subtitle: 'Male Osteoporosis Risk Estimation Score',
  question: 'For a man, is the risk of osteoporosis high enough to measure bone density?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [['55 or younger', 0], ['56 to 74', 3], ['75 or older', 4]].map(([label, points]) => ({ label, points })) },
    { id: 'weight', type: 'choice', label: 'Weight', ee: 'CMB_Weight', default: 2, options: [['70 kg (154 lb) or less', 6], ['70 to 80 kg (154 to 176 lb)', 4], ['Over 80 kg (176 lb)', 0]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check if present' },
    { id: 'copd', type: 'check', label: 'COPD', points: 3, ee: 'CHK_COPD' }
  ],
  points: { label: 'MORES', max: 13 },
  compute(a) {
    return pointsOf(tool, a) >= 6 ? { level: 3, headline: 'Higher than average risk for osteoporosis (LR+ 2.4)' } : { level: 1, headline: 'Low risk for osteoporosis (LR− 0.08)' };
  }
};
