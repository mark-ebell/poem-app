// Two-month mortality in nontraumatic coma (Hamel 1995; EE+ 260).
const P = ['29% (95% CI 15% to 46%)', '51% (95% CI 38% to 63%)', '60% (95% CI 50% to 71%)', '84% (95% CI 73% to 91%)', '96% (95% CI 87% to 100%)', '100% (95% CI 66% to 100%)'];

module.exports = {
  id: 'coma-prognosis',
  eeId: 260,
  title: 'Nontraumatic coma prognosis',
  subtitle: '2-month mortality in nontraumatic coma',
  question: 'For a patient in nontraumatic coma (Glasgow Coma Scale under 10 for at least 6 hours), what is the risk of death within 2 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'brainstem', type: 'check', label: 'Abnormal brain stem response', ee: 'IDC_CHECKBOX_1' },
    { id: 'verbal', type: 'check', label: 'Absent verbal response', ee: 'IDC_CHECKBOX_2' },
    { id: 'withdrawal', type: 'check', label: 'Absent withdrawal to pain', ee: 'IDC_CHECKBOX_3' },
    { id: 'creat', type: 'check', label: 'Creatinine 1.5 mg/dL (132.5 µmol/L) or more', ee: 'IDC_CHECKBOX_4' },
    { id: 'age', type: 'check', label: 'Age 70 or older', ee: 'IDC_CHECKBOX_5' }
  ],
  footnote: 'Excludes coma from trauma, drug intoxication, hypothermia, an operative complication, or a metabolic cause (diabetic ketoacidosis, hyperosmolar coma, thyrotoxicosis, myxedema, hepatic encephalopathy, uremia, abnormal sodium or calcium).',
  compute(a) {
    const n = a.brainstem + a.verbal + a.withdrawal + a.creat + a.age;
    return { score: { value: n, max: 5, label: 'Risk factors' }, level: [2, 3, 3, 4, 4, 4][n], headline: `2-month mortality: ${P[n]}` };
  }
};
