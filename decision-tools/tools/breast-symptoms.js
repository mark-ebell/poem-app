// Breast cancer in women presenting to primary care with breast symptoms (EE+ 515).
const P = ['0.16', '0.30', '0.54', '0.99', '1.8', '3.2', '5.7', '9.9', '17', '27', '40', '55', '69', '80', '88'];
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'breast-symptoms',
  eeId: 515,
  title: 'Breast cancer risk with breast symptoms',
  subtitle: 'Breast cancer in women presenting to primary care with breast symptoms',
  question: 'For a woman seeing her primary care physician with breast symptoms, how likely is breast cancer?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [['18 to 29', 0], ['30 to 39', 1], ['40 to 49', 3], ['50 to 59', 4], ['60 to 69', 5], ['70 to 99', 8]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'lump', type: 'check', label: 'Lump', points: 3, ee: 'LUMP' },
    { id: 'nipple', type: 'check', label: 'Nipple change', points: 2, ee: 'CHANGE' },
    { id: 'discharge', type: 'check', label: 'Nipple discharge', points: 1, ee: 'DISCHARGE' }
  ],
  points: { label: 'Score', max: 14 },
  compute(a) {
    return { headline: `Probability of breast cancer: ${P[pointsOf(tool, a)]}%` };
  }
};
