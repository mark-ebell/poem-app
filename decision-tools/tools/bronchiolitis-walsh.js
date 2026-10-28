// Need for admission in bronchiolitis (Walsh 2004; EE+ 310). As on EE+, age is used only to check that
// the rule applies (3 to 24 months); the score uses a fixed age term.
module.exports = {
  id: 'bronchiolitis-walsh',
  eeId: 310,
  title: 'Bronchiolitis: need for hospitalization',
  subtitle: 'Admission in infants with bronchiolitis',
  question: 'For a child aged 3 months to 2 years with bronchiolitis, is admission recommended?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'months', min: 3, max: 24, ee: 'IDC_EDIT_1' },
    { id: 'tachy', type: 'check', label: 'Tachycardia (over the 97th percentile for age)', ee: 'IDC_CHECKBOX_2' },
    { id: 'work', type: 'check', label: 'Increased work of breathing', ee: 'IDC_CHECKBOX_1' },
    { id: 'dehyd', type: 'choice', label: 'Dehydration', ee: 'IDC_COMBOBOX_1', options: [{ label: 'None' }, { label: 'Mild' }, { label: 'Moderate' }, { label: 'Severe' }] }
  ],
  footnote: 'Use clinical judgement.',
  compute(a) {
    const s = 1.221 * a.work + 1.33 * a.tachy - 5 * 0.15 + 0.933 * a.dehyd;
    return { score: { value: Math.round(s * 10) / 10, label: 'Score' }, ...(s < -0.33 ? { level: 1, headline: 'Admission not recommended' } : { level: 3, headline: 'Admission recommended' }) };
  }
};
