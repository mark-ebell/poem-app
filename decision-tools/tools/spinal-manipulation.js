// Two-item rule for benefit from spinal manipulation in low back pain (Fritz 2005; EE+ 349). EE+ said 26/73
// was 34.4%; it is 35.6% (Mark Ebell, 2026-10-27).
module.exports = {
  id: 'spinal-manipulation',
  eeId: 349,
  title: 'Benefit from spinal manipulation (low back pain)',
  subtitle: 'Good outcome from spinal manipulation in acute low back pain',
  question: 'For an adult with low back pain, no radiation to the legs, low or moderate disability and no red flags, how likely is a good outcome from spinal manipulation?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'short', type: 'check', label: 'Symptoms for less than 16 days', ee: 'chk1' },
    { id: 'knee', type: 'check', label: 'No symptoms below the knee', ee: 'chk2' }
  ],
  compute(a) {
    return a.short && a.knee ? { headline: '35 of 41 (85.4%) had a good outcome from spinal manipulation' }
      : a.short || a.knee ? { headline: '26 of 73 (35.6%) had a good outcome from spinal manipulation' }
      : { headline: '2 of 27 (7.4%) had a good outcome from spinal manipulation' };
  }
};
