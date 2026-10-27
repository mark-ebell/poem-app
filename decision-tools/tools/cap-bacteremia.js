// Bacteremia in community-acquired pneumonia (external validation: Kim 2017; EE+ 587).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'cap-bacteremia',
  eeId: 587,
  title: 'Bacteremia in community-acquired pneumonia',
  subtitle: 'Bacteremia in adults hospitalized with pneumonia',
  question: 'For an adult hospitalized with community-acquired pneumonia, what is the risk of bacteremia?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'temp', type: 'check', label: 'Temperature below 35°C or above 40°C', points: 5, ee: 'cb3' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 90 mm Hg', points: 3, ee: 'cb1' },
    { id: 'hr', type: 'check', label: 'Heart rate above 125/min', points: 3, ee: 'cb2' },
    { id: 'plt', type: 'check', label: 'Platelets below 130 × 10⁹/L', points: 3, ee: 'cb5' },
    { id: 'crp', type: 'check', label: 'C-reactive protein above 17 mg/dL', points: 3, ee: 'cb7' },
    { id: 'wbc', type: 'check', label: 'White cell count below 4 or above 12 × 10⁹/L', points: 2, ee: 'cb4' },
    { id: 'albumin', type: 'check', label: 'Albumin below 3.3 g/dL', points: 2, ee: 'cb6' }
  ],
  points: { label: 'Score', max: 21 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 5 ? { level: 1, headline: 'Low risk: 1.2% bacteremia' } : s <= 10 ? { level: 2, headline: 'Moderate risk: 7.3% bacteremia' } : { level: 4, headline: 'High risk: 31.5% bacteremia' };
  }
};
