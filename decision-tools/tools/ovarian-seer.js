// Ovarian cancer risk by age 65 and over a lifetime (SEER-based; EE+ 338).
// [pregnancies][years of oral contraceptives] -> [by 65, lifetime]
const T = [[['1.6', '3.4'], ['1.7', '3.6'], ['0.6', '1.4']], [['1.1', '2.3'], ['0.7', '1.6'], ['0.4', '0.9']], [['0.6', '1.4'], ['0.5', '1.1'], ['0.3', '0.6']]];

module.exports = {
  id: 'ovarian-seer',
  eeId: 338,
  title: 'Ovarian cancer risk (SEER)',
  subtitle: 'Risk of ovarian cancer by age 65 and over a lifetime',
  question: 'For a woman, what is the risk of ovarian cancer by age 65 and over her lifetime?',
  inputs: [
    { id: 'pregnancies', type: 'choice', label: 'Pregnancies carried to term', ee: 'combo1', options: [{ label: '0' }, { label: '1 to 2' }, { label: 'More than 2' }] },
    { id: 'ocp', type: 'choice', label: 'Years of oral contraceptive use', ee: 'combo2', options: [{ label: '0' }, { label: '1 to 3' }, { label: 'More than 3' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'family', type: 'check', label: 'Mother or sister diagnosed with ovarian cancer', ee: 'chk1' }
  ],
  compute(a) {
    const [by65, life] = a.family ? ['4.4', '9.4'] : T[a.pregnancies][a.ocp];
    return { headline: `Risk of ovarian cancer by age 65: ${by65}%`, lines: [`Over a lifetime: ${life}%`] };
  }
};
