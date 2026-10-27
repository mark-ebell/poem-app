// Neurosensory impairment or death at 18 months in extremely low birthweight infants (Schmidt 2003; EE+ 192).
const P = ['19%', '44%', '62%', '88%'];

module.exports = {
  id: 'elbw-outcome',
  eeId: 192,
  title: 'Prognosis with birthweight 500 to 999 g',
  subtitle: 'Death or neurosensory impairment at 18 months in extremely low birthweight infants',
  question: 'For an infant with a birthweight of 500 to 999 g, what is the risk of death or neurosensory impairment by 18 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bpd', type: 'check', label: 'Bronchopulmonary dysplasia', ee: 'IDC_CHECKBOX_1' },
    { id: 'brain', type: 'check', label: 'Brain injury', ee: 'IDC_CHECKBOX_2' },
    { id: 'rop', type: 'check', label: 'Severe retinopathy', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const n = a.bpd + a.brain + a.rop;
    return { score: { value: n, max: 3, label: 'Morbidities' }, level: [1, 2, 3, 4][n], headline: `${P[n]} chance of death, cerebral palsy, cognitive delay, hearing loss or bilateral blindness by 18 months` };
  }
};
