// Rochester criteria for febrile infants (Jaskiewicz 1994; EE+ 191). EE+ listed the criteria without a calculator.
module.exports = {
  id: 'rochester',
  eeId: 191,
  title: 'Rochester criteria (febrile infants)',
  subtitle: 'Low risk of serious bacterial infection in febrile infants 60 days or younger',
  question: 'For a well-appearing infant 60 days or younger with a rectal temperature of 38°C (100.4°F) or more, is the risk of serious bacterial infection low?',
  inputs: [
    { type: 'heading', label: 'Check each criterion the infant meets' },
    { id: 'well', type: 'check', label: 'Appears generally well' },
    { id: 'healthy', type: 'check', label: 'Previously healthy: term (37 weeks or more), no perinatal antibiotics, no treatment for unexplained hyperbilirubinemia, no current or recent antibiotics, no chronic illness, not hospitalized longer than the mother' },
    { id: 'focus', type: 'check', label: 'No skin, soft tissue, bone, joint or ear infection' },
    { id: 'wbc', type: 'check', label: 'Peripheral white cell count 5000 to 15,000/µL' },
    { id: 'bands', type: 'check', label: 'Absolute band count 1500/µL or less' },
    { id: 'urine', type: 'check', label: '10 or fewer white cells per high-power field on spun urine' },
    { id: 'diarrhea', type: 'choice', label: 'Diarrhea?', options: [{ label: 'No' }, { label: 'Yes' }] },
    { id: 'stool', type: 'check', label: '5 or fewer white cells per high-power field on stool smear', when: a => a.diarrhea === 1 }
  ],
  compute(a) {
    const met = a.well && a.healthy && a.focus && a.wbc && a.bands && a.urine && (a.diarrhea === 0 || a.stool);
    return met
      ? { level: 1, headline: 'Low risk: meets all the Rochester criteria', lines: ['Serious bacterial infection 1.1% (95% CI 0.4% to 2.8%); bacteremia 0.5%. Negative likelihood ratio 0.15.'] }
      : { level: 3, headline: 'Not low risk: does not meet all the Rochester criteria', lines: ['Positive likelihood ratio 2.'] };
  }
};
