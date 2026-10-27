// Lab-based rule for febrile infants 60 days or younger (Kuppermann 2019 derivation; EE+ 578).
module.exports = {
  id: 'febrile-infant-labs',
  eeId: 578,
  title: 'Febrile infants 60 days or younger: lab-based rule (2019 derivation)',
  subtitle: 'Serious bacterial infection in febrile infants',
  question: 'For a previously healthy infant 60 days or younger with fever of 38°C or more, what is the risk of serious bacterial infection?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ua', type: 'check', label: 'Positive urinalysis', ee: 'cb1' },
    { id: 'anc', type: 'check', label: 'Absolute neutrophil count above 4090/µL', ee: 'cb2' },
    { id: 'pct', type: 'check', label: 'Procalcitonin above 1.71 ng/mL', ee: 'cb3' }
  ],
  compute(a) {
    return a.ua || a.anc || a.pct ? { level: 3, headline: 'Elevated risk: 167 of 802 (20.8%) had a serious bacterial infection (UTI, bacteremia or meningitis)' }
      : { level: 1, headline: 'Low risk: 3 of 1019 (0.30%) had a serious bacterial infection' };
  }
};
