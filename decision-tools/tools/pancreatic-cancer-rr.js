// Relative risk of pancreatic cancer for adults 40 to 70 (EE+ 269): each factor's relative risk divided by the
// population-average relative risk.
module.exports = {
  id: 'pancreatic-cancer-rr',
  eeId: 269,
  title: 'Pancreatic cancer relative risk',
  subtitle: 'Relative risk of pancreatic cancer compared with the average adult',
  question: 'For an adult aged 40 to 70, what is the relative risk of pancreatic cancer compared with others of the same age?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: '40 to 64' }, { label: '65 to 70' }] },
    { id: 'tobacco', type: 'choice', label: 'Tobacco use', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Under 14 cigarettes a day' }, { label: '14 to 25 a day' }, { label: 'More than 25 a day' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dm', type: 'check', label: 'History of diabetes', ee: 'IDC_CHECKBOX_1' },
    { id: 'veg', type: 'check', label: '3 or more servings of vegetables a day', ee: 'IDC_CHECKBOX_2' }
  ],
  footnote: 'No data on family history were available for this analysis.',
  compute(a) {
    const pDm = a.age === 0 ? 0.0582 : 0.0898;
    const num = (a.dm ? 2 : 1) * (a.tobacco === 1 ? 1.3 : 1) * (a.tobacco === 2 ? 2.5 : 1) * (a.veg ? 0.6 : 1);
    const den = (pDm * 2 + 1 - pDm) * (0.125 * 1.3 + 0.875) * (0.103 * 2.5 + 0.897) * (0.27 * 0.6 + 0.73);
    return { headline: `Relative risk of pancreatic cancer: ${(num / den).toFixed(2)}` };
  }
};
