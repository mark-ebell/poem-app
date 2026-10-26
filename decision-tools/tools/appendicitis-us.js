// Ruling out appendicitis after an inconclusive ultrasound (Leeuwenburgh 2014; EE+ 528). Wording as in EE+.
module.exports = {
  id: 'appendicitis-us',
  eeId: 528,
  title: 'Appendicitis after an inconclusive ultrasound (Leeuwenburgh)',
  subtitle: 'Ruling out appendicitis in adults with a non-diagnostic ultrasound',
  question: 'For an adult with suspected appendicitis and an inconclusive ultrasound, can appendicitis be ruled out?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'rlq', type: 'check', label: 'Pain radiating to the right lower quadrant', ee: 'RLQ' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', ee: 'VOMITING' },
    { id: 'wbc', type: 'check', label: 'White cell count above 12.0 × 10⁹/L', ee: 'WHITE' }
  ],
  compute(a) {
    return a.male + a.rlq + a.vomiting + a.wbc < 2
      ? { level: 1, headline: 'Low risk: 6% had appendicitis', lines: ['Consider discharge with follow-up in 24 hours.'] }
      : { level: 3, headline: 'High risk: 42% had appendicitis', lines: ['Consider additional imaging with CT or MRI.'] };
  }
};
