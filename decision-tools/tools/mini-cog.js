// Mini-Cog dementia screen (Borson 2000; EE+ 367).
module.exports = {
  id: 'mini-cog',
  eeId: 367,
  title: 'Dementia screening (Mini-Cog)',
  subtitle: 'Three-word recall and clock drawing',
  question: 'For an older patient, does the Mini-Cog suggest dementia?',
  inputs: [
    { type: 'heading', label: '1. Ask the patient to repeat 3 unrelated words (e.g. ball, dog, television).' },
    { id: 'clock', type: 'choice', label: '2. Clock drawing: a clock set to 10 minutes after 11', ee: 'CMB_Clock', options: [{ label: 'Drawn correctly' }, { label: 'Incorrect' }],
      note: 'Correct: a circle with the numbers 1 to 12 in about the right places and hands pointing at the 11 and the 2.' },
    { id: 'recall', type: 'choice', label: '3. Words recalled', ee: 'CMB_Items', default: 3, options: [{ label: '0' }, { label: '1' }, { label: '2' }, { label: '3' }] }
  ],
  compute(a) {
    return a.recall === 0 || (a.recall < 3 && a.clock === 1) ? { level: 3, headline: 'Positive screen for dementia' } : { level: 1, headline: 'Negative screen for dementia' };
  }
};
