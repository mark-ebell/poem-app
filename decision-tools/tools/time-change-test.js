// Time and Change test for dementia (Froehlich 1998; EE+ 252). EE+ gave the instructions and interpretation
// without a calculator.
module.exports = {
  id: 'time-change-test',
  eeId: 252,
  title: 'Dementia screening (Time and Change test)',
  subtitle: 'Two-item screen for dementia',
  question: 'For an older patient, does the Time and Change test suggest dementia?',
  inputs: [
    { type: 'heading', label: 'Check each task done correctly' },
    { id: 'time', type: 'check', label: 'Tells the time: sketch or point to an analog clock and ask the time (2 tries within 60 seconds)' },
    { id: 'change', type: 'check', label: 'Makes change: place 3 quarters, 7 dimes and 7 nickels in front of the patient and ask for one dollar in change (2 tries within 120 seconds)' }
  ],
  compute(a) {
    return a.time && a.change ? { level: 1, headline: 'Negative screen', lines: ['With a 20% risk of dementia, 8% with a negative screen are demented; with a 10% risk, 4%.'] }
      : { level: 3, headline: 'Positive screen', lines: ['With a 20% risk of dementia, 80% with a positive screen are demented; with a 10% risk, 64%.'] };
  }
};
