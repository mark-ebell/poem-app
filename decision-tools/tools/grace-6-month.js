// GRACE score: 6-month mortality after hospitalization for acute coronary syndrome (EE+ 271).
const { pointsOf } = require('../lib');
const opts = (labels, points) => labels.map((label, k) => ({ label, points: points[k] }));
const BANDS = [[69, '1% or less', 1], [89, '1%', 1], [109, '2%', 2], [129, '5%', 2], [149, '7.5%', 3], [169, '15%', 3], [189, '25%', 4], [209, '43%', 4], [Infinity, 'over 50%', 4]];

const tool = module.exports = {
  id: 'grace-6-month',
  eeId: 271,
  title: 'GRACE score: 6-month mortality',
  subtitle: 'Death within 6 months of discharge after acute coronary syndrome',
  question: 'After hospitalization for an acute coronary syndrome, what is the risk of death in the 6 months after discharge?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age (years)', ee: 'IDC_COMBOBOX_1', options: opts(['29 or younger', '30 to 39', '40 to 49', '50 to 59', '60 to 69', '70 to 79', '80 to 89', '90 or older'], [0, 0, 18, 36, 55, 73, 91, 100]) },
    { id: 'hr', type: 'choice', label: 'Resting heart rate (beats/min)', ee: 'IDC_COMBOBOX_2', options: opts(['Below 50', '50 to 69', '70 to 89', '90 to 109', '110 to 149', '150 to 199', '200 or more'], [0, 3, 9, 14, 23, 35, 43]) },
    { id: 'creat', type: 'choice', label: 'Initial serum creatinine (mg/dL)', ee: 'IDC_COMBOBOX_3', options: opts(['0 to 0.39', '0.4 to 0.79', '0.8 to 1.19', '1.2 to 1.59', '1.6 to 1.99', '2.0 to 3.99', '4 or more'], [1, 3, 5, 7, 9, 15, 20]) },
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'IDC_COMBOBOX_4', options: opts(['Below 80', '80 to 99', '100 to 119', '120 to 139', '140 to 159', '160 to 199', '200 or more'], [24, 22, 18, 14, 10, 4, 0]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chf', type: 'check', label: 'History of CHF', points: 24, ee: 'IDC_CHECKBOX_1' },
    { id: 'mi', type: 'check', label: 'History of myocardial infarction', points: 12, ee: 'IDC_CHECKBOX_2' },
    { id: 'st', type: 'check', label: 'ST-segment depression', points: 11, ee: 'IDC_CHECKBOX_3' },
    { id: 'enzymes', type: 'check', label: 'Elevated cardiac enzymes', points: 15, ee: 'IDC_CHECKBOX_4' },
    { id: 'nopci', type: 'check', label: 'No in-hospital percutaneous coronary intervention', points: 14, ee: 'IDC_CHECKBOX_5' }
  ],
  points: { label: 'GRACE score', max: 263 },
  compute(a) {
    const s = pointsOf(tool, a);
    const b = BANDS.find(([max]) => s <= max);
    return { level: b[2], headline: `6-month mortality: ${b[1]}` };
  }
};
