// 0/1-hour high-sensitivity troponin I algorithm for acute MI (McCord; EE+ 602).
// Rule-out: 0-hour hs-cTnI below 4 ng/L, or below 5 ng/L with a 1-hour rise below 4 ng/L.
// Rule-in: 0-hour 50 ng/L or more, or a 1-hour rise of 15 ng/L or more. Otherwise observation.
// (EE+ had no option for 4 ng/L and ruled out 5 ng/L; corrected to the published algorithm.)
const T0 = [{ label: 'Below 4 ng/L', below4: true, below5: true }, { label: '4 ng/L', below5: true }, { label: '5 ng/L' },
  { label: '6 to 49 ng/L' }, { label: '50 ng/L or more', high: true }];

module.exports = {
  id: 'troponin-0-1h',
  eeId: 602,
  title: '0/1-hour high-sensitivity troponin algorithm',
  subtitle: 'Ruling acute MI in or out with hs-cTnI',
  question: 'For an adult in the ED with symptoms suspicious for acute MI, what do the 0- and 1-hour high-sensitivity troponin I values show?',
  inputs: [
    { id: 't0', type: 'choice', label: 'Initial (0-hour) high-sensitivity troponin I', options: T0.map(o => ({ label: o.label })) },
    { id: 'delta', type: 'choice', label: 'Increase 1 hour later', ee: 'ddl2', options: [{ label: 'Below 4 ng/L' }, { label: '4 to 14 ng/L' }, { label: '15 ng/L or more' }] }
  ],
  footnote: 'Rule-out: 0-hour below 4 ng/L, or below 5 ng/L with a 1-hour rise below 4 ng/L. Rule-in: 0-hour 50 ng/L or more, or a 1-hour rise of 15 ng/L or more. Otherwise: observation.',
  compute(a) {
    const t0 = T0[a.t0];
    let r = { level: 2, headline: 'Intermediate risk (observation zone)', mi: '6.1%', m30: '2.6%', m12: '9.6%' };
    if (t0.below4 || (t0.below5 && a.delta === 0)) r = { level: 1, headline: 'Low risk (rule-out zone)', mi: '0.4%', m30: '0.4%', m12: '1.1%' };
    if (t0.high || a.delta === 2) r = { level: 4, headline: 'High risk (rule-in zone)', mi: '57%', m30: '7.5%', m12: '13.2%' };
    return { level: r.level, headline: r.headline, lines: [{ label: 'Risk of acute MI', value: r.mi }, { label: 'MACE at 30 to 45 days', value: r.m30 }, { label: 'MACE at 12 to 18 months', value: r.m12 }] };
  }
};
