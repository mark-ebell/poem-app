// 1-hour rule-out and rule-in of acute MI with high-sensitivity troponin T (Reichlin, Basel; EE+ 502).
module.exports = {
  id: 'basel-troponin-t',
  eeId: 502,
  title: '0/1-hour high-sensitivity troponin T algorithm (Basel)',
  subtitle: 'Ruling acute MI in or out with hs-cTnT',
  question: 'For an adult in the ED with chest pain suggestive of acute MI (onset or peak in the last 12 hours), what do the admission and 1-hour hs-troponin T values show?',
  inputs: [
    { id: 't0', type: 'choice', label: 'Initial high-sensitivity troponin T', ee: 'INITIAL', options: [{ label: 'Below 12 ng/L' }, { label: '12 to 50.9 ng/L' }, { label: '51 ng/L or more' }] },
    { id: 'delta', type: 'choice', label: 'Absolute increase within 1 hour', ee: 'DELTA', options: [{ label: 'Below 3 ng/L' }, { label: '3 to 4.9 ng/L' }, { label: '5 ng/L or more' }] }
  ],
  compute(a) {
    if (a.t0 === 0 && a.delta === 0) return { level: 1, headline: 'Low risk (rule-out)', lines: ['0 of 259 (0%) had acute MI.'] };
    if (a.t0 === 2 && a.delta === 2) return { level: 4, headline: 'High risk (rule-in)', lines: ['64 of 76 (84%) had acute MI.'] };
    return { level: 2, headline: 'Moderate risk (observation)', lines: ['8 of 101 (8%) had acute MI.'] };
  }
};
