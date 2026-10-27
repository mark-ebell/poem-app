// Head CT in HIV-infected patients with neurologic symptoms (Rothman 1999; EE+ 217). EE+ listed the rule without a calculator.
module.exports = {
  id: 'hiv-head-ct',
  eeId: 217,
  title: 'Head CT in HIV infection (Rothman)',
  subtitle: 'New lesions on head CT in HIV-infected patients',
  question: 'For an HIV-infected patient in the ED with neurologic symptoms, is a head CT warranted?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'seizure', type: 'check', label: 'New seizure' },
    { id: 'orientation', type: 'check', label: 'Depressed or altered orientation' },
    { id: 'headacheNew', type: 'check', label: 'Headache different in quality' },
    { id: 'headacheLong', type: 'check', label: 'Prolonged headache (3 days or more)' },
    { id: 'focal', type: 'check', label: 'Focal neurologic deficit' }
  ],
  footnote: 'Any finding was 100% sensitive in a study of 110 HIV-infected ED patients with neurologic symptoms; not prospectively validated.',
  compute(a) {
    return a.seizure || a.orientation || a.headacheNew || a.headacheLong || a.focal
      ? { level: 3, headline: 'Head CT warranted' } : { level: 1, headline: 'None of the findings: head CT not indicated by this rule' };
  }
};
