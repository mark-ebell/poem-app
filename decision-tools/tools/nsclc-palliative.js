// 3-month survival in inoperable non-small cell lung cancer referred for palliative radiotherapy (EE+ 249).
module.exports = {
  id: 'nsclc-palliative',
  eeId: 249,
  title: 'Non-small cell lung cancer: 3-month survival',
  subtitle: 'Survival with inoperable NSCLC referred for palliative radiotherapy',
  question: 'For a patient with inoperable non-small cell lung cancer referred for palliative radiotherapy, what is the chance of surviving 3 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'weight', type: 'check', label: 'Weight loss of more than 10 pounds', ee: 'IDC_CHECKBOX_1' },
    { id: 'who', type: 'check', label: 'WHO performance status 3 or 4', ee: 'IDC_CHECKBOX_2', note: 'In bed more than half the time and needing help with self-care, or worse.' },
    { id: 'lymph', type: 'check', label: 'Lymphocyte count 1000/µL or less', ee: 'IDC_CHECKBOX_3' },
    { id: 'extensive', type: 'check', label: 'Extensive (rather than limited) disease', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const n = a.weight + a.who + a.lymph + a.extensive;
    return { score: { value: n, max: 4, label: 'Risk factors' }, level: n <= 1 ? 1 : n === 2 ? 3 : 4, headline: `3-month survival: ${n <= 1 ? '95% or more' : n === 2 ? '60% to 74%' : 'under 20%'}` };
  }
};
