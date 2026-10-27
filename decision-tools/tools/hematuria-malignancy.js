// Cancer in asymptomatic microscopic hematuria (EE+ 486).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'hematuria-malignancy',
  eeId: 486,
  title: 'Cancer risk with asymptomatic microscopic hematuria',
  subtitle: 'Urologic cancer in asymptomatic microscopic hematuria',
  question: 'For a patient with asymptomatic microscopic hematuria, what is the risk of cancer?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 50 or older', points: 4, ee: 'AGE' },
    { id: 'gross', type: 'check', label: 'Gross hematuria in the past 6 months', points: 4, ee: 'GROSS' },
    { id: 'smoking', type: 'check', label: 'History of smoking', points: 1, ee: 'SMOKING' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'MALE' },
    { id: 'rbc', type: 'check', label: 'More than 25 red cells per high-power field on a recent urinalysis', points: 1, ee: 'RBC' }
  ],
  points: { label: 'Score', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 5 ? { level: 1, headline: 'Low risk: 0.2% had cancer (3 of 1428)' } : s < 9 ? { level: 2, headline: 'Moderate risk: 1.6% had cancer (38 of 2354)' } : { level: 4, headline: 'High risk: 11.1% had cancer (70 of 562)' };
  }
};
