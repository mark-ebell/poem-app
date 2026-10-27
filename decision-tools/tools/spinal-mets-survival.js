// Survival with spinal metastases (EE+ 296).
module.exports = {
  id: 'spinal-mets-survival',
  eeId: 296,
  title: 'Spinal metastases: survival',
  subtitle: 'Median survival with spinal metastases',
  question: 'For a patient with spinal metastases, what is the median survival?',
  inputs: [
    { id: 'karnofsky', type: 'choice', label: 'Karnofsky score', ee: 'Karnofsky', options: [{ label: '80 to 100' }, { label: '50 to 70' }, { label: '20 to 40' }],
      note: '80 to 100: normal activity with effort, some signs or symptoms of disease, or better. 20 to 40: needs special care and help; disabled, or worse. 50 to 70: all others.' },
    { id: 'primary', type: 'choice', label: 'Primary tumor', ee: 'Primary', options: [{ label: 'Breast' }, { label: 'Prostate' }, { label: 'Lung' }, { label: 'Other' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'visceral', type: 'check', label: 'Visceral metastases', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const s = (2 - a.karnofsky) + (3 - a.primary) + 1 - a.visceral;
    return s <= 3 ? { score: { value: s, max: 6, label: 'Score' }, level: 4, headline: 'High risk: median survival 3 months' }
      : s <= 5 ? { score: { value: s, max: 6, label: 'Score' }, level: 2, headline: 'Moderate risk: median survival 9 months' }
      : { score: { value: s, max: 6, label: 'Score' }, level: 1, headline: 'Low risk: median survival 18.7 months' };
  }
};
