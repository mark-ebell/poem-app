// ID Migraine screener (Lipton 2003; EE+ 280).
module.exports = {
  id: 'id-migraine',
  eeId: 280,
  title: 'Migraine screener (ID Migraine)',
  subtitle: 'Three-question screen for migraine',
  question: 'For a primary care patient with headache, does the ID Migraine screener suggest migraine?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'nausea', type: 'check', label: 'Nausea', ee: 'IDC_CHECKBOX_NAUSEA' },
    { id: 'photo', type: 'check', label: 'Photophobia', ee: 'IDC_CHECKBOX_PHOTOPHOBIA' },
    { id: 'disability', type: 'check', label: 'Headache limited you from working, studying or doing what you needed to do on at least 1 day in the last 3 months', ee: 'IDC_CHECKBOX_HEADACHE' }
  ],
  footnote: 'Probabilities assume a 33% probability of migraine among primary care patients with headache.',
  compute(a) {
    return a.nausea + a.photo + a.disability >= 2 ? { level: 3, headline: 'Positive screen for migraine (LR+ 3.3): 62% probability of migraine' }
      : { level: 1, headline: 'Negative screen for migraine (LR− 0.25): 11% probability of migraine' };
  }
};
