// Epidemic triage score: death and critical care need in suspected infection (Talmor 2007; EE+ 388).
const OUT = [['1.7%', '7.0%', '1.7%'], ['5.7%', '16%', '3.9%'], ['11%', '30%', '8.3%'], ['32%', '40%', '10%']];

module.exports = {
  id: 'talmor-triage',
  eeId: 388,
  title: 'Epidemic triage score (Talmor)',
  subtitle: 'Death and need for critical care in suspected infection',
  question: 'For a patient in the ED with suspected infection, what are the risks of death, intensive care and mechanical ventilation?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: ['CHK_Age65', 'CHK_Age74'], options: [{ label: 'Under 65' }, { label: '65 to 74' }, { label: '75 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'rr', type: 'check', label: 'Respiratory rate above 30/min', ee: 'CHK_Resp' },
    { id: 'hr', type: 'check', label: 'Heart rate greater than systolic BP', ee: 'CHK_Heart' },
    { id: 'sat', type: 'check', label: 'Oxygen saturation below 90%', ee: 'CHK_Oxygen' },
    { id: 'mental', type: 'check', label: 'Altered mental status', ee: 'CHK_Mental' }
  ],
  footnote: 'Developed and validated in ED patients with a range of suspected infections; not validated during an actual pandemic.',
  compute(a) {
    const s = (a.age > 0 ? 1 : 0) + a.rr + a.hr + a.sat + a.mental;
    const [d, icu, vent] = OUT[Math.min(3, s)];
    return { score: { value: s, label: 'Score' }, headline: `Mortality ${d}`, lines: [`Intensive care ${icu}; mechanical ventilation ${vent}`] };
  }
};
