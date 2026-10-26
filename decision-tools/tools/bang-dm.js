// Diabetes risk self-assessment score (Bang 2009; EE+ 420). EE+ added a point for being physically
// active; in the published score (Table 2) being physically active subtracts a point.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'bang-dm',
  eeId: 420,
  title: 'Diabetes risk score (Bang)',
  subtitle: 'Undiagnosed diabetes: patient self-assessment',
  question: 'For an adult without known diabetes, how likely is undiagnosed diabetes?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [{ label: 'Under 40', points: 0 }, { label: '40 to 49', points: 1 }, { label: '50 to 59', points: 2 }, { label: '60 or older', points: 3 }] },
    { id: 'weight', type: 'choice', label: 'Weight', ee: 'CMB_Obesity', options: [
      { label: 'Not overweight', points: 0 }, { label: 'Overweight (BMI 25 to 29.9)', points: 1 }, { label: 'Obese (BMI 30 to 39.9)', points: 2 }, { label: 'Extremely obese (BMI 40 or more)', points: 3 }] },
    { id: 'active', type: 'choice', label: 'More physically active than others of the same age?', default: 1, options: [{ label: 'Yes', points: -1 }, { label: 'No', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'CHK_Male' },
    { id: 'family', type: 'check', label: 'Parent or sibling with diabetes', points: 1, ee: 'CHK_DM' },
    { id: 'htn', type: 'check', label: 'Hypertension (above 140/90 mm Hg, or treated)', points: 1, ee: 'CHK_Hypertension' }
  ],
  points: { label: 'Score', max: 9 },
  compute(a) {
    return pointsOf(tool, a) >= 4 ? { level: 3, headline: 'High risk: 8% likelihood of undiagnosed diabetes' } : { level: 1, headline: 'Low risk: 1% likelihood of undiagnosed diabetes' };
  }
};
