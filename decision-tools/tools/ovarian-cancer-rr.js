// Relative risk of ovarian cancer for women 40 to 70 (Harvard; EE+ 270): each factor's relative risk divided by
// the population-average relative risk.
const F = [['ocp', 'Used oral contraceptives for 5 years or more', 'IDC_CHECKBOX_1', 0.2, 0.7], ['parity', '2 or more births', 'IDC_CHECKBOX_2', 0.65, 0.8],
  ['breastfed', 'Breastfed for 1 year or more', 'IDC_CHECKBOX_3', 0.13, 0.8], ['tubal', 'Tubal ligation', 'IDC_CHECKBOX_4', 0.35, 0.6], ['hysterectomy', 'Hysterectomy', 'IDC_CHECKBOX_5', 0.16, 0.8]];

module.exports = {
  id: 'ovarian-cancer-rr',
  eeId: 270,
  title: 'Ovarian cancer relative risk (Harvard)',
  subtitle: 'Relative risk of ovarian cancer compared with the average woman',
  question: 'For a woman aged 40 to 70, what is her relative risk of ovarian cancer compared with others of the same age?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    ...F.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  footnote: 'No data on family history were available for this analysis.',
  compute(a) {
    const rr = F.reduce((t, [id, , , p, r]) => t * (a[id] ? r : 1) / (p * r + 1 - p), 1);
    return { headline: `Relative risk of ovarian cancer: ${rr.toFixed(2)}` };
  }
};
