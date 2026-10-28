// RAPID score for pleural infection (Rahman 2014; EE+ 517).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'rapid-pleural',
  eeId: 517,
  title: 'Pleural infection prognosis (RAPID score)',
  subtitle: 'Mortality in pleural infection',
  question: 'For a patient presenting with pleural infection, what is the risk of death?',
  inputs: [
    { id: 'urea', type: 'choice', label: 'Urea / BUN', ee: 'UREA', options: ['Under 5 mmol/L (14 mg/dL)', '5 to 8 mmol/L (14 to 22.4 mg/dL)', 'Over 8 mmol/L (22.4 mg/dL)'].map((label, points) => ({ label, points })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: ['Under 50', '50 to 70', 'Over 70'].map((label, points) => ({ label: `${label} years`, points })) },
    { id: 'nonPurulent', type: 'check', label: 'Non-purulent pleural fluid', points: 1, ee: 'FLUID' },
    { id: 'hospital', type: 'check', label: 'Hospital-acquired pleural infection', points: 1, ee: 'INFECTION' },
    { id: 'albumin', type: 'check', label: 'Serum albumin under 27 g/L', points: 1, ee: 'SERUM' }
  ],
  points: { label: 'RAPID score', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 3 ? { level: 1, headline: 'Low risk: 1.4% mortality (4/283)' } : s < 5 ? { level: 2, headline: 'Moderate risk: 11% mortality (20/186)' } : { level: 4, headline: 'High risk: 44% mortality (35/80)' };
  }
};
