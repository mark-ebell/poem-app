// Outpatient Bleeding Risk Index (validation: Wells 2003; EE+ 285).
module.exports = {
  id: 'obri-wells',
  eeId: 285,
  title: 'Outpatient Bleeding Risk Index (Wells validation)',
  subtitle: 'Bleeding on warfarin for DVT or PE',
  question: 'For a patient on warfarin for DVT or PE, what is the risk of bleeding?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'IDC_CHECKBOX_1' },
    { id: 'gi', type: 'check', label: 'History of GI bleeding', ee: 'IDC_CHECKBOX_2' },
    { id: 'stroke', type: 'check', label: 'History of stroke', ee: 'IDC_CHECKBOX_3' },
    { id: 'comorbid', type: 'check', label: 'Recent MI, hematocrit below 30%, creatinine above 1.5 mg/dL, or diabetes', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    return a.age + a.gi + a.stroke + a.comorbid === 0
      ? { level: 1, headline: 'Low risk: 0 major and 7 minor bleeds among 128 patients over 18 months' }
      : { level: 3, headline: 'Moderate or high risk: 10 major and 11 minor bleeds among 94 patients over 18 months' };
  }
};
