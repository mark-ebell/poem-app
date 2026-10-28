// Single-question screen for panic disorder (EE+ 272). EE+ gave the question and answers without a calculator.
module.exports = {
  id: 'panic-one-question',
  eeId: 272,
  title: 'Panic disorder (single question)',
  subtitle: 'One-question screen for panic disorder',
  question: 'Ask: "In the last 4 weeks, have you had an anxiety attack, suddenly feeling fear or panic?"',
  inputs: [
    { id: 'answer', type: 'choice', label: 'Answer', options: [{ label: 'No' }, { label: 'Yes' }] }
  ],
  footnote: 'Assumes use as a screening question with a 5% overall risk of panic disorder.',
  compute(a) {
    return a.answer === 1 ? { level: 3, headline: 'Probability of panic disorder: 18%' } : { level: 1, headline: 'Probability of panic disorder: 0.5%' };
  }
};
