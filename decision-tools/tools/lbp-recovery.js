// Rapid recovery from acute low back pain in primary care (EE+ 529).
const OUT = [
  ['Low risk', '54%', '70%', '86%', '91%'], ['Moderate risk', '30%', '54%', '72%', '85%'],
  ['High risk', '26%', '45%', '62%', '78%'], ['Very high risk', '13%', '33%', '53%', '68%']
];

module.exports = {
  id: 'lbp-recovery',
  eeId: 529,
  title: 'Low back pain: likelihood of rapid recovery',
  subtitle: 'Recovery from acute low back pain in primary care',
  question: 'For a primary care patient with acute low back pain, how likely is recovery over the next 3 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'severe', type: 'check', label: 'Pain 8 or higher on a 10-point scale', ee: 'SCALE' },
    { id: 'duration', type: 'check', label: 'Pain for more than 5 days', ee: 'DURATION' },
    { id: 'previous', type: 'check', label: 'More than one previous episode', ee: 'PREVIOUS' }
  ],
  compute(a) {
    const n = a.severe + a.duration + a.previous, [label, w1, w2, w4, w12] = OUT[n];
    return { score: { value: n, max: 3, label: 'Risk factors' }, level: n + 1, headline: label,
      table: { head: ['Recovered at', 'Percent'], rows: [['1 week', w1], ['2 weeks', w2], ['4 weeks', w4], ['12 weeks', w12]] } };
  }
};
