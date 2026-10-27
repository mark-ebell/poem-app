// COPD Lung Cancer Screening Score (COPD-LUCSS; de Torres 2015; EE+ 514).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'copd-lcss',
  eeId: 514,
  title: 'Lung cancer risk in COPD (COPD-LUCSS)',
  subtitle: 'Lung cancer risk in smokers with COPD',
  question: 'For a patient aged 50 to 79 with COPD and at least 12.5 pack-years of smoking, what is the 10-year risk of lung cancer?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bmi', type: 'check', label: 'BMI under 25 kg/m²', points: 1, ee: 'BMI' },
    { id: 'packYears', type: 'check', label: 'More than 60 pack-years', points: 2, ee: 'PACKYEARS' },
    { id: 'age', type: 'check', label: 'Age over 60', points: 3, ee: 'AGE' },
    { id: 'emphysema', type: 'check', label: 'Emphysema on imaging', points: 4, ee: 'EMPHYSEMA' }
  ],
  points: { label: 'COPD-LUCSS', max: 10 },
  compute(a) {
    return pointsOf(tool, a) <= 6 ? { level: 1, headline: 'Low risk: 5% developed lung cancer in 10 years' } : { level: 3, headline: 'High risk: 16% developed lung cancer in 10 years' };
  }
};
