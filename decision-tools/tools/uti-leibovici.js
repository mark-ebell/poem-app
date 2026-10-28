// UTI diagnosis in young women (Leibovici 1993; EE+ 174).
module.exports = {
  id: 'uti-leibovici',
  eeId: 174,
  title: 'UTI diagnosis (Leibovici)',
  subtitle: 'Probability of UTI in young women with suspected UTI',
  question: 'For a young woman with suspected UTI, is the probability of infection high or low?',
  inputs: [
    { id: 'wbc', type: 'check', label: '10 or more WBC per high-power field', ee: 'IDC_CHECKBOX_1' },
    { id: 'rbc', type: 'check', label: '5 or more RBC per high-power field', ee: 'IDC_CHECKBOX_2' },
    { id: 'sex', type: 'check', label: 'Sexually active (at least 1 episode of vaginal intercourse in the last month)', ee: 'IDC_CHECKBOX_3' },
    { id: 'discharge', type: 'check', label: 'Vaginal discharge', ee: 'IDC_CHECKBOX_4' },
    { id: 'days', type: 'choice', label: 'Duration of symptoms', ee: 'IDC_COMBOBOX_1', options: Array.from({ length: 14 }, (_, k) => ({ label: `${k + 1} day${k ? 's' : ''}` })) }
  ],
  footnote: 'Baseline risk of UTI = 70%.',
  compute(a) {
    const s = -1.01 + 1.72 * a.wbc + 1.65 * a.rbc + 1.12 * a.sex - 1.19 * a.discharge - 0.1 * (a.days + 1);
    return s >= 0.4 ? { level: 4, headline: 'High probability of UTI (95%)' } : { level: 1, headline: 'Low probability of UTI (18%)' };
  }
};
