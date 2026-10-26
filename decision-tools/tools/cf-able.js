// CF-ABLE score: death or lung transplant in adults with cystic fibrosis (McCarthy 2013; EE+ 494).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'cf-able',
  eeId: 494,
  title: 'CF-ABLE score',
  subtitle: 'Death or lung transplant within 4 years in cystic fibrosis',
  question: 'For a patient 16 or older with cystic fibrosis, what is the risk of death or lung transplant within 4 years?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fev1', type: 'check', label: 'Average FEV1 over the last 3 months below 52.8% of predicted', points: 7, ee: 'FEV1' },
    { id: 'exac', type: 'check', label: 'Exacerbation needing IV antibiotics in the last 3 months', points: 3, ee: 'ANTIBIOTICS' },
    { id: 'bmi', type: 'check', label: 'Body mass index below 20.1 kg/m²', points: 2, ee: 'BMI' },
    { id: 'age', type: 'check', label: 'Age under 24', points: 2, ee: 'AGE' }
  ],
  points: { label: 'CF-ABLE score', max: 14 },
  compute(a) {
    const s = pointsOf(tool, a);
    const p = s < 5 ? 'Under 1%' : s < 8 ? '5%' : s < 10 ? '15%' : '26%';
    return { level: s < 5 ? 1 : s < 8 ? 2 : s < 10 ? 3 : 4, headline: `${p} probability of death or lung transplant within 4 years` };
  }
};
