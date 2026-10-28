// Postoperative pneumonia risk index in men (Arozullah 2001; EE+ 405).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'postop-pneumonia',
  eeId: 405,
  title: 'Post-op likelihood of pneumonia',
  subtitle: 'Pneumonia after major noncardiac surgery in men',
  question: 'For a man undergoing noncardiac surgery, what is the probability of postoperative pneumonia?',
  inputs: [
    { id: 'surgery', type: 'choice', label: 'Type of surgery', ee: 'CMB_TypeSurgery', default: 2, options: [['Abdominal aortic aneurysm', 15], ['Thoracic', 14], ['Upper abdominal', 10], ['Neck', 8], ['Neurosurgery', 8], ['Vascular', 3], ['Other', 0]].map(([label, points]) => ({ label, points })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [['Under 50', 0], ['50 to 59', 4], ['60 to 69', 9], ['70 to 79', 13], ['80 or older', 17]].map(([label, points]) => ({ label: `${label} years`, points })) },
    { id: 'functional', type: 'choice', label: 'Functional status', ee: 'CMB_Functional', options: [{ label: 'Independent', points: 0 }, { label: 'Partially dependent', points: 6 }, { label: 'Totally dependent', points: 10 }] },
    { id: 'bun', type: 'choice', label: 'BUN', ee: 'CMB_BUN', options: [['Under 8 mg/dL (2.86 mmol/L)', 4], ['8 to 21 mg/dL (2.87 to 7.84 mmol/L)', 0], ['22 to 30 mg/dL (7.85 to 10.7 mmol/L)', 2], ['30 mg/dL (10.7 mmol/L) or more', 3]].map(([label, points]) => ({ label, points })) },
    { id: 'weight', type: 'check', label: 'Weight loss over 10% in the past 6 months', points: 7, ee: 'CHK_Weight' },
    { id: 'copd', type: 'check', label: 'History of COPD', points: 5, ee: 'CHK_COPD' },
    { id: 'ga', type: 'check', label: 'General anesthesia', points: 4, ee: 'CHK_GenAn' },
    { id: 'sensorium', type: 'check', label: 'Impaired sensorium', points: 4, ee: 'CHK_ImpSens' },
    { id: 'cva', type: 'check', label: 'History of cerebrovascular accident', points: 4, ee: 'CHK_Cereb' },
    { id: 'transfusion', type: 'check', label: 'Transfusion of more than 4 units', points: 3, ee: 'CHK_Transfusion' },
    { id: 'emergency', type: 'check', label: 'Emergency surgery', points: 3, ee: 'CHK_Surgery' },
    { id: 'steroid', type: 'check', label: 'Steroid use for a chronic condition', points: 3, ee: 'CHK_Steroid' },
    { id: 'smoker', type: 'check', label: 'Current smoker within 1 year', points: 3, ee: 'CHK_Smoker' },
    { id: 'alcohol', type: 'check', label: 'More than 2 drinks a day in the past 2 weeks', points: 2, ee: 'CHK_Alcohol' }
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a);
    const [p, level] = s < 16 ? ['0.24', 1] : s < 26 ? ['1.2', 1] : s < 41 ? ['4.6', 2] : s < 56 ? ['10.8', 3] : ['15.9', 4];
    return { level, headline: `${p}% probability of postoperative pneumonia` };
  }
};
