// Stool cultures in hospital-onset diarrhea (Bauer 2001; EE+ 150). EE+ listed the rule without a calculator.
module.exports = {
  id: 'bauer-stool-culture',
  eeId: 150,
  title: 'Stool culture in hospital-onset diarrhea (Bauer)',
  subtitle: 'Which inpatients with diarrhea need a stool culture',
  question: 'For an inpatient whose diarrhea began more than 72 hours after admission, is a stool culture (for bacteria other than C. difficile) needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older' },
    { id: 'immune', type: 'check', label: 'Neutropenia or HIV infection' },
    { id: 'community', type: 'check', label: 'Diarrhea began in the community (before admission)' },
    { id: 'signs', type: 'check', label: 'A non-diarrheal sign of enteric infection' }
  ],
  footnote: 'In the prospective validation, these criteria identified 63 of 65 patients with enteropathogenic bacteria other than C. difficile.',
  compute(a) {
    return a.age || a.immune || a.community || a.signs
      ? { level: 3, headline: 'High risk: order a stool culture' }
      : { level: 1, headline: 'None of the high-risk criteria: a stool culture is not needed' };
  }
};
