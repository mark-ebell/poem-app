// Severe fibrosis in hepatitis C (Metwally 2007; EE+ 390).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'hcv-fibrosis-metwally',
  eeId: 390,
  title: 'Severe fibrosis in hepatitis C (Metwally)',
  subtitle: 'Stage III or IV fibrosis in chronic hepatitis C',
  question: 'For a patient with chronic hepatitis C, how likely is severe fibrosis?',
  inputs: [
    { id: 'platelets', type: 'choice', label: 'Platelet count', ee: 'CMB_Platelets', options: ['184 × 10⁹/L or more', '150 to 183', '125 to 149', '100 to 124', 'Under 100'].map((label, points) => ({ label, points })) },
    { id: 'albumin', type: 'choice', label: 'Albumin', ee: 'CMB_Albumin', options: ['3.5 g/dL or more', '3.0 to 3.49', 'Under 3.0'].map((label, points) => ({ label, points })) },
    { id: 'ast', type: 'choice', label: 'AST', ee: 'CMB_AST', options: ['Below the upper limit of normal', '1 to 3 times the upper limit', '3 to 8 times the upper limit', 'More than 8 times the upper limit'].map((label, points) => ({ label, points })) }
  ],
  points: { label: 'Score', max: 9 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 2 ? { level: 1, headline: '4 of 76 (5%) had severe fibrosis (stage III or IV)' } : s < 4 ? { level: 2, headline: '13 of 45 (29%) had severe fibrosis (stage III or IV)' } : { level: 4, headline: '15 of 16 (94%) had severe fibrosis (stage III or IV)' };
  }
};
