// ICU admission in children hospitalized with RSV (Opavsky 1995; EE+ 197).
const OUT = [['56%', '39%', '8%'], ['12%', '6%', '1%']];
module.exports = {
  id: 'rsv-icu',
  eeId: 197,
  title: 'RSV prognosis (pediatric)',
  subtitle: 'ICU admission in children hospitalized with RSV',
  question: 'For a child hospitalized with RSV infection, what is the probability of ICU admission?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', default: 2, options: [{ label: 'Under 6 weeks' }, { label: '6 to 12 weeks' }, { label: 'Over 12 weeks' }] },
    { id: 'o2', type: 'choice', label: 'Initial oxygen saturation', ee: 'O2', default: 1, options: [{ label: '90% or less' }, { label: 'Over 90%' }] }
  ],
  footnote: 'Validated at 7 Canadian tertiary care centers.',
  compute(a) {
    const p = OUT[a.o2][a.age];
    return { level: parseInt(p, 10) < 5 ? 1 : parseInt(p, 10) < 20 ? 2 : 4, headline: `${p} probability of ICU admission` };
  }
};
