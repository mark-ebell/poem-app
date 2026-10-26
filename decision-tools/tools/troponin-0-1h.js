// 0/1-hour high-sensitivity troponin I algorithm for acute MI (McCord; EE+ 602).
module.exports = {
  id: 'troponin-0-1h',
  eeId: 602,
  title: '0/1-hour high-sensitivity troponin algorithm',
  subtitle: 'Ruling acute MI in or out with hs-cTnI',
  question: 'For an adult in the ED with symptoms suspicious for acute MI, what do the 0- and 1-hour high-sensitivity troponin I values show?',
  inputs: [
    { id: 't0', type: 'choice', label: 'Initial (0-hour) high-sensitivity troponin I', ee: 'ddl1', options: [{ label: 'Below 4 ng/L' }, { label: '5 ng/L' }, { label: '6 to 49 ng/L' }, { label: '50 ng/L or more' }] },
    { id: 'delta', type: 'choice', label: 'Increase 1 hour later', ee: 'ddl2', options: [{ label: 'Below 4 ng/L' }, { label: '4 to 14 ng/L' }, { label: '15 ng/L or more' }] }
  ],
  compute(a) {
    let r = { level: 2, headline: 'Intermediate risk (observation zone)', mi: '6.1%', m30: '2.6%', m12: '9.6%' };
    if (a.t0 === 0 || (a.t0 === 1 && a.delta === 0)) r = { level: 1, headline: 'Low risk (rule-out zone)', mi: '0.4%', m30: '0.4%', m12: '1.1%' };
    if (a.t0 === 3 || a.delta === 2) r = { level: 4, headline: 'High risk (rule-in zone)', mi: '57%', m30: '7.5%', m12: '13.2%' };
    return { level: r.level, headline: r.headline, lines: [{ label: 'Risk of acute MI', value: r.mi }, { label: 'MACE at 30 to 45 days', value: r.m30 }, { label: 'MACE at 12 to 18 months', value: r.m12 }] };
  }
};
