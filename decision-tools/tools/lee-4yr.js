// Lee index: 4-year mortality in older adults (Lee 2006; EE+ 402).
const { pointsOf } = require('../lib');
const check = (id, label, points, ee) => ({ id, type: 'check', label, points, ee });

const tool = module.exports = {
  id: 'lee-4yr',
  eeId: 402,
  title: '4-year mortality in older adults (Lee index)',
  subtitle: '4-year mortality in community-dwelling older adults',
  question: 'For a community-dwelling older adult, what is the risk of death within 4 years?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [['Under 60', 0], ['60 to 64', 1], ['65 to 69', 2], ['70 to 74', 3], ['75 to 79', 4], ['80 to 84', 5], ['85 or older', 7]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    check('male', 'Male', 2, 'CHK_Male'), check('cancer', 'Cancer', 2, 'CHK_Cancer'), check('lung', 'Lung disease', 2, 'CHK_Lung'), check('hf', 'Heart failure', 2, 'CHK_HF'),
    check('smoker', 'Current smoker', 2, 'CHK_Smoke'), check('bathing', 'Difficulty bathing, or needs help', 2, 'CHK_Bath'), check('finances', 'Difficulty managing finances, or cannot or does not', 2, 'CHK_Finances'),
    check('walking', 'Difficulty walking 2 blocks, or cannot', 2, 'CHK_Walk'), check('pushing', 'Difficulty pushing or pulling heavy objects', 1, 'CHK_PushPull'), check('dm', 'Diabetes', 1, 'CHK_Diabetes'),
    check('bmi', 'BMI under 25 kg/m²', 1, 'CHK_BMI')
  ],
  points: { label: 'Lee index' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 6 ? { level: 1, headline: 'Low risk: 3% 4-year mortality' } : s < 10 ? { level: 2, headline: 'Moderate risk: 15% 4-year mortality' }
      : s < 13 ? { level: 3, headline: 'High risk: 40% 4-year mortality' } : { level: 4, headline: 'Very high risk: 67% 4-year mortality' };
  }
};
