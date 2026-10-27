// Poor neurologic outcome at 1 month after carbon monoxide poisoning (EE+ 630).
const P = ['1.3%', '2.5%', '16.3%', '43.1%', '76.9%', '83.3%'];

module.exports = {
  id: 'co-neuro',
  eeId: 630,
  title: 'Carbon monoxide poisoning: neurologic prognosis',
  subtitle: 'Poor neurologic outcome 1 month after carbon monoxide poisoning',
  question: 'For a patient admitted with carbon monoxide poisoning, what is the risk of a poor neurologic outcome at 1 month?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 50', ee: 'cb1' },
    { id: 'gcs', type: 'check', label: 'Glasgow Coma Scale under 13', ee: 'cb2' },
    { id: 'shock', type: 'check', label: 'Shock at presentation', ee: 'cb3' },
    { id: 'noHbo', type: 'check', label: 'No hyperbaric oxygen', ee: 'cb4' },
    { id: 'ck', type: 'check', label: 'Creatine kinase over 320 U/L', ee: 'cb5' }
  ],
  compute(a) {
    const n = a.age + a.gcs + a.shock + a.noHbo + a.ck;
    return { score: { value: n, max: 5, label: 'Score' }, level: [1, 1, 2, 4, 4, 4][n], headline: `${P[n]} had a poor neurologic outcome at 1 month` };
  }
};
