// Walter index: 1-year mortality after hospital discharge in older adults (Walter 2001; EE+ 160). EE+ showed
// no result for the highest score (20); here it is very high risk. EE+ said 65 or older; the study enrolled patients 70 or older.
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));
const ADL = 'Activities of daily living: bathing, dressing, using the toilet, transferring from bed to chair, and eating.';

const tool = module.exports = {
  id: 'walter-discharge',
  eeId: 160,
  title: 'Mortality after hospital discharge in older adults (Walter)',
  subtitle: '1-year mortality after discharge for patients 70 and older',
  question: 'For a patient 70 or older being discharged from hospital, what is the risk of death within 1 year?',
  inputs: [
    { id: 'cancer', type: 'choice', label: 'Cancer', ee: 'IDC_COMBOBOX_1', options: opts([['None', 0], ['Solitary', 3], ['Metastatic', 8]]) },
    { id: 'albumin', type: 'choice', label: 'Albumin', ee: 'IDC_COMBOBOX_2', options: opts([['Over 3.4 g/dL', 0], ['3.0 to 3.4', 1], ['Under 3.0', 2]]) },
    { id: 'adl', type: 'choice', label: 'Dependent in activities of daily living at discharge', ee: 'IDC_COMBOBOX_3', options: opts([['None', 0], ['1 to 4', 2], ['All 5', 5]]), note: ADL },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'chf', type: 'check', label: 'Heart failure', points: 2, ee: 'IDC_CHECKBOX_2' },
    { id: 'creat', type: 'check', label: 'Creatinine over 3 mg/dL', points: 2, ee: 'IDC_CHECKBOX_3' }
  ],
  points: { label: 'Score', max: 20 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 2 ? { level: 1, headline: '1-year mortality: 4% (95% CI 2% to 6%)' } : s < 4 ? { level: 2, headline: '1-year mortality: 19% (95% CI 15% to 23%)' }
      : s < 7 ? { level: 3, headline: '1-year mortality: 34% (95% CI 29% to 39%)' } : { level: 4, headline: '1-year mortality: 64% (95% CI 58% to 70%)' };
  }
};
