// Cambridge diabetes risk score (Griffin 2000; EE+ 186). EE+ cut the age term to a whole number; here it is not.
const logitOf = a => -6.322 + (a.female ? -0.879 : 0) + (a.antihtn ? 1.222 : 0) + (a.steroids ? 2.191 : 0) + 0.063 * a.age
  + [0, 0.699, 1.97, 2.518][a.bmi] + [0, 0.728, 0.753][a.family] + [0, -0.218, 0.855][a.smoking];

module.exports = {
  id: 'griffin-dm',
  eeId: 186,
  title: 'Cambridge diabetes risk score',
  subtitle: 'Undiagnosed type 2 diabetes in primary care',
  question: 'For an adult without known diabetes, how likely is undiagnosed diabetes?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 120, step: 1, ee: 'AGE' },
    { id: 'bmi', type: 'choice', label: 'Body mass index', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 25' }, { label: '25 to 27.4' }, { label: '27.5 to 29.9' }, { label: '30 or more' }] },
    { id: 'family', type: 'choice', label: 'First-degree relatives with diabetes', ee: 'IDC_COMBOBOX_2', options: [{ label: 'None' }, { label: 'Parent or sibling' }, { label: 'Parent and sibling' }] },
    { id: 'smoking', type: 'choice', label: 'Smoking', ee: 'IDC_COMBOBOX_3', options: [{ label: 'Non-smoker' }, { label: 'Ex-smoker' }, { label: 'Current smoker' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_1' },
    { id: 'steroids', type: 'check', label: 'Prescribed steroids', ee: 'IDC_CHECKBOX_2' },
    { id: 'antihtn', type: 'check', label: 'Prescribed antihypertensive medication', ee: 'IDC_CHECKBOX_3' }
  ],
  logitOf,
  compute(a) {
    return { headline: `Probability of undiagnosed diabetes: ${(100 / (1 + Math.exp(-logitOf(a)))).toFixed(1)}%` };
  },
  evidence: { reference: 'Griffin SJ, Little PS, Hales CN, Kinmonth AL, Wareham NJ. Diabetes risk score: towards earlier detection of type 2 diabetes in general practice. Diabetes Metab Res Rev. 2000;16(3):164-171.' }
};
