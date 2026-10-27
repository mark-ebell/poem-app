// Orbital abscess in children with periorbital infection (Rudloe 2010; EE+ 465).
const OUT = { 1: [4, 'High risk', '44%'], 2: [3, 'Moderate risk', '13.5%'], 3: [2, 'Low risk', '2.0%'], 4: [1, 'Very low risk', '0.4%'] };

module.exports = {
  id: 'orbital-abscess',
  eeId: 465,
  title: 'Orbital abscess in periorbital infection (Rudloe)',
  subtitle: 'Orbital abscess in children with periorbital or orbital cellulitis',
  question: 'For an otherwise healthy child with suspected periorbital or orbital cellulitis, how likely is an orbital abscess?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'proptosis', type: 'check', label: 'Proptosis, or pain or limitation of eye movements', ee: 'PROPTOSIS' },
    { id: 'edema', type: 'check', label: 'Edema beyond the eyelid', ee: 'EDEMA' },
    { id: 'anc', type: 'check', label: 'Absolute neutrophil count above 10,000/µL', ee: 'ANC' },
    { id: 'age', type: 'check', label: 'Age 3 or older', ee: 'AGE' },
    { id: 'abx', type: 'check', label: 'Antibiotics for more than 24 hours before presentation', ee: 'ANTIBIOTICS' }
  ],
  footnote: 'Not prospectively validated.',
  compute(a) {
    const r = a.proptosis ? 1 : a.edema ? (a.anc && a.abx ? 1 : 2) : a.anc ? (a.age ? 2 : 3) : (a.age ? 3 : 4);
    const [level, label, p] = OUT[r];
    return { level, headline: `${label}: ${p} had an orbital abscess` };
  }
};
