// PECARN febrile infant rule, as on EE+ (ANC above 4000/µL, procalcitonin 0.5 ng/mL or more; EE+ 616).
module.exports = {
  id: 'pecarn-febrile',
  eeId: 616,
  title: 'PECARN febrile infant rule',
  subtitle: 'Low risk of serious bacterial infection in febrile infants under 60 days',
  question: 'For a previously healthy febrile infant under 60 days, is the risk of serious bacterial infection low?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ua', type: 'check', label: 'Abnormal urinalysis (positive nitrite or leukocyte esterase, or more than 5 white cells per high-power field)', ee: 'cb1' },
    { id: 'anc', type: 'check', label: 'Absolute neutrophil count above 4000/µL', ee: 'cb2' },
    { id: 'pct', type: 'check', label: 'Procalcitonin 0.5 ng/mL or more', ee: 'cb3' }
  ],
  compute(a) {
    return a.ua || a.anc || a.pct
      ? { level: 3, headline: 'Not low risk: 124 of 605 (20.5%) in external validation had UTI (102), bacteremia (19) or meningitis (6)' }
      : { level: 1, headline: 'Low risk: 3 of 758 (0.4%) in external validation had UTI (1), bacteremia (2) or meningitis (0)', lines: ['Use with caution in infants 0 to 29 days, who have a higher risk of HSV and bacterial meningitis.'] };
  }
};
