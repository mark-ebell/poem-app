// Rule of 7s: Lyme meningitis in children (Cohn 2012; EE+ 450).
module.exports = {
  id: 'lyme-rule7',
  eeId: 450,
  title: "Lyme meningitis (Rule of 7's)",
  subtitle: 'Lyme vs aseptic meningitis in children in endemic areas',
  question: 'For a child with meningitis (CSF pleocytosis) in a Lyme-endemic area, how likely is Lyme meningitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'headache', type: 'check', label: 'Headache for less than 7 days', ee: 'HEADACHE' },
    { id: 'mono', type: 'check', label: 'Less than 70% mononuclear cells in the CSF', ee: 'CSF' },
    { id: 'palsy', type: 'check', label: 'No seventh (or other) cranial nerve palsy', ee: 'PALSY' }
  ],
  footnote: 'Erythema migrans or positive Lyme serology is diagnostic of Lyme meningitis in a child with CSF pleocytosis. Probabilities assume an overall prevalence of 28%.',
  compute(a) {
    return a.headache && a.mono && a.palsy ? { level: 1, headline: 'Low risk for Lyme meningitis: 3.8%' } : { level: 3, headline: 'Not low risk for Lyme meningitis: 39%' };
  }
};
