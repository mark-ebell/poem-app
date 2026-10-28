// Two-question screen for drug use disorder (Tiet 2015; EE+ 536).
module.exports = {
  id: 'drug-use-two-question',
  eeId: 536,
  title: 'Screening for drug use disorder (two questions)',
  subtitle: 'Brief screen for drug use disorder',
  question: 'For an adult, does a two-question screen suggest a drug use disorder?',
  inputs: [
    { id: 'days', type: 'choice', label: 'How many days in the past 12 months have you used drugs other than alcohol?', required: true, ee: 'alcohol', eeIndex: [1, 2], options: [{ label: 'Fewer than 7' }, { label: '7 or more' }] },
    { id: 'more', type: 'choice', label: 'How many days in the past 12 months have you used drugs more than you meant to?', required: true, ee: 'drugs', eeIndex: [1, 2], when: a => a.days === 0, options: [{ label: '0 or 1' }, { label: '2 or more' }] }
  ],
  footnote: '100% sensitive and 94% specific.',
  compute(a) {
    return a.days === 1 || a.more === 1 ? { level: 3, headline: 'Positive screen for drug use disorder; further evaluation needed' } : { level: 1, headline: 'Negative screen for drug use disorder' };
  }
};
