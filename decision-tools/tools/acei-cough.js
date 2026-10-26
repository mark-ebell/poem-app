// ACE inhibitor cough (Morimoto 2004; EE+ 293).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'acei-cough',
  eeId: 293,
  title: 'ACE inhibitor cough risk',
  subtitle: 'Cough with an ACE inhibitor',
  question: 'For a patient starting an ACE inhibitor, what is the risk of cough?',
  inputs: [
    { id: 'race', type: 'choice', label: 'Race or ethnicity', ee: ['IDC_CHECKBOX_2', 'IDC_CHECKBOX_3'], options: [
      { label: 'African American', points: 0 }, { label: 'East Asian (Chinese, Korean or Japanese)', points: 6 }, { label: 'Other', points: 2 }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 60', points: 0 }, { label: '60 to 69', points: 3 }, { label: '70 or older', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', points: 3, ee: 'IDC_CHECKBOX_1' },
    { id: 'naive', type: 'check', label: 'No previous ACE inhibitor use', points: 3, ee: 'IDC_CHECKBOX_4' },
    { id: 'prior', type: 'check', label: 'Previous cough with an ACE inhibitor', points: 13, ee: 'IDC_CHECKBOX_5' }
  ],
  points: { label: 'Score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 5 ? { level: 1, headline: 'Risk of cough: 4% (179 patients)' }
      : s <= 8 ? { level: 2, headline: 'Risk of cough: 14% (270 patients)' }
      : s <= 11 ? { level: 3, headline: 'Risk of cough: 20% (108 patients)' }
      : { level: 4, headline: 'Risk of cough: 60% (10 patients)' };
  }
};
