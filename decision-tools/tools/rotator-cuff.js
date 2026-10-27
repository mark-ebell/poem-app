// Rotator cuff tear in shoulder pain (Murrell 2001; EE+ 165).
module.exports = {
  id: 'rotator-cuff',
  eeId: 165,
  title: 'Rotator cuff tear diagnosis',
  subtitle: 'Rotator cuff tear in patients with shoulder pain',
  question: 'For a patient with shoulder pain, how likely is a rotator cuff tear?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 40' }, { label: '40 to 59' }, { label: '60 to 69' }, { label: '70 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'supra', type: 'check', label: 'Supraspinatus weakness', ee: 'IDC_CHECKBOX_1' },
    { id: 'er', type: 'check', label: 'Weakness in external rotation', ee: 'IDC_CHECKBOX_2' },
    { id: 'impingement', type: 'check', label: 'Positive impingement sign', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const n = a.supra + a.er + a.impingement;
    const p = n === 0 ? '5% (95% CI 2% to 11%)' : n === 1 ? ['12%', '45% (95% CI 36% to 55%)', '45% (95% CI 36% to 55%)', '76% (95% CI 56% to 90%)'][a.age]
      : n === 2 && a.age < 2 ? '64% (95% CI 47% to 79%)' : '98% (95% CI 89% to 100%)';
    return { headline: `Probability of a rotator cuff tear: ${p}` };
  }
};
