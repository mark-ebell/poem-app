// Lee index: 10-year mortality in community-dwelling adults 50 and older (Cruz 2013; EE+ 487). EE+ gave age 80 to
// 84 six points and 85 or older six; as in the Lee index, they score 5 and 7.
const P = ['2.3% (95% CI 0.7% to 3.8%)', '5.1% (95% CI 3.2% to 7.1%)', '7.0% (95% CI 5.3% to 8.6%)', '10% (95% CI 8.4% to 12%)', '15% (95% CI 13% to 17%)', '23% (95% CI 20% to 26%)',
  '34% (95% CI 31% to 37%)', '43% (95% CI 39% to 47%)', '52% (95% CI 48% to 57%)', '58% (95% CI 54% to 63%)', '70% (95% CI 65% to 75%)', '82% (95% CI 77% to 87%)', '83% (95% CI 78% to 88%)', '91% (95% CI 86% to 95%)', '93% (95% CI 90% to 96%)'];
const { pointsOf } = require('../lib');
const check = (id, label, points, ee) => ({ id, type: 'check', label, points, ee });

const tool = module.exports = {
  id: 'lee-10yr',
  eeId: 487,
  title: '10-year mortality in adults 50 and older (Lee index)',
  subtitle: '10-year mortality in community-dwelling adults',
  question: 'For a community-dwelling adult 50 or older, what is the risk of death within 10 years?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [['50 to 59', 0], ['60 to 64', 1], ['65 to 69', 2], ['70 to 74', 3], ['75 to 79', 4], ['80 to 84', 5], ['85 or older', 7]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    check('male', 'Male', 2, 'MALE'), check('tobacco', 'Current tobacco use', 2, 'TOBACCO'), check('bmi', 'BMI under 25 kg/m²', 1, 'BMI'), check('dm', 'Diabetes', 1, 'DIABETES'),
    check('cancer', 'Cancer (not skin)', 2, 'CANCER'), check('lung', 'Chronic lung disease', 2, 'LUNG'), check('hf', 'Heart failure', 2, 'HF'), check('bathing', 'Difficulty bathing', 2, 'BATHING'),
    check('finances', 'Difficulty managing finances', 2, 'FINANCES'), check('walking', 'Difficulty walking several blocks', 2, 'WALKING'), check('pushing', 'Difficulty pushing or pulling large objects', 1, 'PUSHING')
  ],
  points: { label: 'Lee index' },
  compute(a) {
    return { headline: `10-year mortality: ${P[Math.min(pointsOf(tool, a), 14)]}` };
  }
};
