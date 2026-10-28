// LRINEC score for necrotizing fasciitis (Wong 2004; EE+ 368).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'lrinec',
  eeId: 368,
  title: 'Necrotizing fasciitis diagnosis (LRINEC score)',
  subtitle: 'Laboratory Risk Indicator for Necrotizing Fasciitis',
  question: 'For a patient with a serious soft tissue infection, what is the risk of necrotizing fasciitis?',
  inputs: [
    { id: 'crp', type: 'check', label: 'C-reactive protein 150 mg/L or more', points: 4, ee: 'CHK_Creac' },
    { id: 'wbc', type: 'choice', label: 'White blood cell count (× 10⁹/L)', ee: 'CMB_WBC', options: ['Under 15', '15 to 25', 'Over 25'].map((label, points) => ({ label, points })) },
    { id: 'hb', type: 'choice', label: 'Hemoglobin (g/dL)', ee: 'CMB_Hemoglobin', options: ['Over 13.5', '11 to 13.5', 'Under 11'].map((label, points) => ({ label, points })) },
    { id: 'na', type: 'check', label: 'Sodium under 135 mmol/L', points: 2, ee: 'CHK_Sodium' },
    { id: 'creat', type: 'check', label: 'Creatinine over 1.6 mg/dL (141 µmol/L)', points: 2, ee: 'CHK_Creat' },
    { id: 'glucose', type: 'check', label: 'Glucose over 180 mg/dL (10 mmol/L)', points: 1, ee: 'CHK_Glucose' }
  ],
  points: { label: 'LRINEC score', max: 13 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 6 ? { level: 1, headline: 'Low risk for necrotizing fasciitis' } : s < 8 ? { level: 2, headline: 'Moderate risk for necrotizing fasciitis' } : { level: 4, headline: 'High risk for necrotizing fasciitis' };
  }
};
