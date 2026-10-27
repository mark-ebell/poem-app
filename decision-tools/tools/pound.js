// POUND mnemonic for migraine (Detsky 2006; EE+ 575).
module.exports = {
  id: 'pound',
  eeId: 575,
  title: 'Migraine probability (POUND)',
  subtitle: 'Migraine as the cause of headache',
  question: 'For a patient with headache, how likely is migraine?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pulsatile', type: 'check', label: 'Pulsatile quality', ee: 'cb5' },
    { id: 'duration', type: 'check', label: 'Duration of 4 to 72 hours', ee: 'cb4' },
    { id: 'unilateral', type: 'check', label: 'Unilateral', ee: 'cb3' },
    { id: 'nausea', type: 'check', label: 'Nausea or vomiting', ee: 'cb2' },
    { id: 'disabling', type: 'check', label: 'Disabling intensity', ee: 'cb1' }
  ],
  footnote: 'Probabilities assume a 33% prevalence of migraine among primary care patients with headache.',
  compute(a) {
    const n = a.pulsatile + a.duration + a.unilateral + a.nausea + a.disabling;
    return n <= 2 ? { score: { value: n, max: 5, label: 'POUND score' }, level: 1, headline: 'Low risk group (LR 0.41): 17% probability of migraine' }
      : n === 3 ? { score: { value: n, max: 5, label: 'POUND score' }, level: 3, headline: 'Moderate risk group (LR 3.5): 64% probability of migraine' }
      : { score: { value: n, max: 5, label: 'POUND score' }, level: 4, headline: 'High risk group (LR 24): 92% probability of migraine' };
  }
};
