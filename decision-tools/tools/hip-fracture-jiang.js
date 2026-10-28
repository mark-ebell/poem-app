// Mortality after hip fracture (Jiang 2005; EE+ 427).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'hip-fracture-jiang',
  eeId: 427,
  title: 'Hip fracture prognosis',
  subtitle: 'In-hospital and 1-year mortality after hip fracture',
  question: 'For a patient over 60 hospitalized with hip fracture, what are the in-hospital and 1-year mortality?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [['60 to 69', 0], ['70 to 79', 6], ['80 to 89', 7], ['90 or older', 13]].map(([label, points]) => ({ label: `${label} years`, points })) },
    ...[['male', 'Male', 6, 'CHK_Male'], ['ltc', 'Admitted from long-term care', 4, 'CHK_LongTerm'], ['copd', 'COPD', 4, 'CHK_COPD'], ['pneumonia', 'Pneumonia', 14, 'CHK_Pneumonia'],
      ['ihd', 'Ischemic heart disease', 5, 'CHK_IHD'], ['mi', 'Previous myocardial infarction', 13, 'CHK_MI'], ['arrhythmia', 'Any cardiac arrhythmia', 5, 'CHK_Arrhythmia'],
      ['chf', 'Congestive heart failure', 7, 'CHK_CHF'], ['cancer', 'Malignancy', 13, 'CHK_Malignancy'], ['malnutrition', 'Malnutrition', 20, 'CHK_Malnutrition'],
      ['electrolyte', 'Any electrolyte disorder', 5, 'CHK_Electrolyte'], ['renal', 'Renal failure', 19, 'CHK_Renal']].map(([id, label, points, ee]) => ({ id, type: 'check', label, points, ee }))
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a);
    const [level, h, y] = s < 8 ? [1, '0.6', '12.1'] : s < 14 ? [2, '1.7', '22.9'] : s < 22 ? [3, '6.2', '36.5'] : [4, '15.5', '52'];
    return { level, headline: `In-hospital mortality ${h}%; 1-year mortality ${y}%` };
  }
};
