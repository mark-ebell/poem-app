// MAGGIC heart failure risk score (Pocock 2013; EE+ 495).
const ONE = ['1.55', '1.55', '1.9', '1.9', '2.3', '2.3', '2.8', '2.8', '3.4', '3.4', '4.1', '4.1', '5.0', '5.0', '6.0', '6.0', '7.3', '7.3', '8.8', '8.8', '10.7', '10.7', '12.6', '12.6', '15.3', '15.3', '18.3', '18.3', '21.8', '21.8', '25.8', '25.8', '30.4', '30.4', '35.5', '35.5', '41.2', '41.2', '47.4', '47.4', '54.0', '54.0', '60.8', '60.8', '67.5', '67.5', '74.1', '74.1'];
const THREE = ['4.1', '4.1', '5.0', '5.0', '6.0', '6.0', '7.3', '7.3', '8.8', '8.8', '10.6', '10.6', '12.8', '12.8', '15.3', '15.3', '18.3', '18.3', '21.8', '21.8', '25.8', '25.8', '30.4', '30.4', '35.5', '35.5', '41.2', '41.2', '47.4', '47.4', '53.9', '53.9', '60.7', '60.7', '67.5', '67.5', '74.0', '74.0', '80.1', '80.1', '85.4', '85.4', '89.7', '89.7', '93.3', '93.3', '95.7', '95.7'];
const o = labels => labels.map(label => ({ label }));
module.exports = {
  id: 'maggic',
  eeId: 495,
  title: 'MAGGIC heart failure risk score',
  subtitle: '1- and 3-year mortality in heart failure',
  question: 'For a patient with heart failure, what is the risk of death at 1 and 3 years?',
  inputs: [
    { id: 'ef', type: 'choice', label: 'Ejection fraction', ee: 'EF', default: 3, options: o(['Below 20%', '20% to 24%', '25% to 29%', '30% to 34%', '35% to 39%', '40% or higher']) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: o(['Under 55', '55 to 59', '60 to 64', '65 to 69', '70 to 74', '75 to 79', '80 or older']) },
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'SBP', options: o(['Below 110', '110 to 119', '120 to 129', '130 to 139', '140 to 149', '150 or higher']) },
    { id: 'bmi', type: 'choice', label: 'Body mass index (kg/m²)', ee: 'BMI', default: 4, options: o(['Below 15', '15 to 19', '20 to 24', '25 to 29', '30 or higher']) },
    { id: 'creat', type: 'choice', label: 'Creatinine (µmol/L)', ee: 'CREAT', default: 1, options: o(['Below 90', '90 to 109', '110 to 129', '130 to 149', '150 to 169', '170 to 209', '210 to 249', '250 or higher']) },
    { id: 'nyha', type: 'choice', label: 'NYHA class', ee: 'NYHA', default: 1, options: o(['I', 'II', 'III', 'IV']) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'MALE' },
    { id: 'smoker', type: 'check', label: 'Current smoker', points: 1, ee: 'SMOKER' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 3, ee: 'DIABETIC' },
    { id: 'copd', type: 'check', label: 'COPD', points: 2, ee: 'COPD' },
    { id: 'noBb', type: 'check', label: 'Not on a beta-blocker', points: 3, ee: 'BETA' },
    { id: 'noAce', type: 'check', label: 'Not on an ACE inhibitor or ARB', points: 1, ee: 'ACE' },
    { id: 'recent', type: 'check', label: 'Heart failure first diagnosed within the past 18 months', points: 2, ee: 'FIRST' }
  ],
  compute(a) {
    const band = a.ef < 3 ? 0 : a.ef < 5 ? 1 : 2;
    const s = [7, 6, 5, 3, 2, 0][a.ef] + [[0, 1, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8, 10, 13], [0, 3, 5, 7, 9, 12, 15]][band][a.age]
      + [[5, 4, 3, 2, 1, 0], [3, 2, 1, 1, 0, 0], [2, 1, 1, 0, 0, 0]][band][a.sbp] + [6, 5, 3, 2, 0][a.bmi] + [0, 1, 2, 3, 4, 5, 6, 8][a.creat] + [0, 2, 6, 8][a.nyha]
      + a.male + a.smoker + 3 * a.dm + 2 * a.copd + 3 * a.noBb + a.noAce + 2 * a.recent;
    const [one, three] = s > 47 ? ['81.6', '98.0'] : [ONE[s], THREE[s]];
    return { score: { value: s, label: 'MAGGIC score' }, level: one < 10 ? 1 : one < 25 ? 2 : one < 50 ? 3 : 4,
      lines: [{ label: '1-year mortality', value: `${one}%` }, { label: '3-year mortality', value: `${three}%` }] };
  }
};
