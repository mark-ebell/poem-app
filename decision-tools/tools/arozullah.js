// Postoperative pneumonia risk index (Arozullah 2001; EE+ 195).
const { pointsOf } = require('../lib');
const CLASSES = [[15, 1, 'Class 1', '0.24%'], [25, 2, 'Class 2', '1.18%'], [40, 3, 'Class 3', '4.6%'], [55, 4, 'Class 4', '10.8%'], [Infinity, 4, 'Class 5', '15.9%']];

const tool = module.exports = {
  id: 'arozullah',
  eeId: 195,
  title: 'Postoperative pneumonia risk index (Arozullah)',
  subtitle: 'Pneumonia after major non-cardiac surgery',
  question: 'For a patient having major non-cardiac surgery, what is the risk of postoperative pneumonia?',
  inputs: [
    { id: 'surgery', type: 'choice', label: 'Type of surgery', ee: 'IDC_COMBOBOX_1', options: [
      { label: 'Abdominal aortic aneurysm repair', points: 15 }, { label: 'Thoracic', points: 14 }, { label: 'Upper abdominal', points: 10 }, { label: 'Neck', points: 8 },
      { label: 'Neurosurgery', points: 8 }, { label: 'Vascular', points: 3 }, { label: 'Other', points: 0 }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_2', options: [
      { label: '80 or older', points: 17 }, { label: '70 to 79', points: 13 }, { label: '60 to 69', points: 9 }, { label: '50 to 59', points: 4 }, { label: 'Under 50', points: 0 }] },
    { id: 'function', type: 'choice', label: 'Functional status', ee: 'IDC_COMBOBOX_3', options: [
      { label: 'Independent', points: 0 }, { label: 'Partially dependent', points: 6 }, { label: 'Totally dependent', points: 10 }] },
    { id: 'bun', type: 'choice', label: 'BUN', ee: 'IDC_COMBOBOX_4', options: [
      { label: 'Under 8 mg/dL (2.9 mmol/L)', points: 4 }, { label: '8 to 21 mg/dL (2.9 to 7.8 mmol/L)', points: 0 },
      { label: '22 to 30 mg/dL (7.9 to 10.7 mmol/L)', points: 2 }, { label: 'Over 30 mg/dL (10.7 mmol/L)', points: 3 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'weight', type: 'check', label: 'Weight loss over 10% in the past 6 months', points: 7, ee: 'IDC_CHECKBOX_1' },
    { id: 'copd', type: 'check', label: 'History of COPD', points: 5, ee: 'IDC_CHECKBOX_7' },
    { id: 'ga', type: 'check', label: 'General anesthesia', points: 4, ee: 'IDC_CHECKBOX_3' },
    { id: 'sensorium', type: 'check', label: 'Impaired sensorium', points: 4, ee: 'IDC_CHECKBOX_9' },
    { id: 'cva', type: 'check', label: 'History of stroke', points: 4, ee: 'IDC_CHECKBOX_6' },
    { id: 'smoker', type: 'check', label: 'Current smoker (within 1 year)', points: 3, ee: 'IDC_CHECKBOX_2' },
    { id: 'steroids', type: 'check', label: 'Long-term steroid use', points: 3, ee: 'IDC_CHECKBOX_5' },
    { id: 'transfusion', type: 'check', label: 'Transfusion of more than 4 units', points: 3, ee: 'IDC_CHECKBOX_8' },
    { id: 'emergency', type: 'check', label: 'Emergency surgery', points: 3, ee: 'IDC_CHECKBOX_10' },
    { id: 'alcohol', type: 'check', label: 'More than 2 drinks a day in the past 2 weeks', points: 2, ee: 'IDC_CHECKBOX_4' }
  ],
  points: { label: 'Risk index' },
  compute(a) {
    const [, level, label, p] = CLASSES.find(([max]) => pointsOf(tool, a) <= max);
    return { level, headline: `${label}: risk of postoperative pneumonia ${p}` };
  }
};
