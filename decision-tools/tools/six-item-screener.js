// Six-Item Screener for cognitive impairment (Callahan 2002; EE+ 453).
module.exports = {
  id: 'six-item-screener',
  eeId: 453,
  title: 'Cognitive impairment screening (Six-Item Screener)',
  subtitle: 'Orientation and recall screen for dementia',
  question: 'For an older patient, does the Six-Item Screener suggest cognitive impairment?',
  inputs: [
    { type: 'heading', label: 'Ask the patient to remember the words grass, paper and shoe (repeat up to 3 times). Check each question answered INCORRECTLY.' },
    { id: 'year', type: 'check', label: 'What year is this?', ee: 'YEAR' },
    { id: 'month', type: 'check', label: 'What month is this?', ee: 'MONTH' },
    { id: 'day', type: 'check', label: 'What is the day of the week?', ee: 'DAY' },
    { type: 'heading', label: 'After 1 minute, ask for the 3 words. Check each word NOT recalled.' },
    { id: 'grass', type: 'check', label: 'Grass', ee: 'GRASS' },
    { id: 'paper', type: 'check', label: 'Paper', ee: 'PAPER' },
    { id: 'shoe', type: 'check', label: 'Shoe', ee: 'SHOE' }
  ],
  compute(a) {
    const n = a.year + a.month + a.day + a.grass + a.paper + a.shoe;
    return n >= 2 ? { score: { value: n, max: 6, label: 'Errors' }, level: 3, headline: 'Positive screen for cognitive impairment' }
      : { score: { value: n, max: 6, label: 'Errors' }, level: 1, headline: 'Negative screen for cognitive impairment' };
  }
};
