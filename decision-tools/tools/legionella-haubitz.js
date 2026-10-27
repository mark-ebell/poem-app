// Ruling out Legionella in community-acquired pneumonia (Haubitz 2014; EE+ 526). Wording as in EE+.
module.exports = {
  id: 'legionella-haubitz',
  eeId: 526,
  title: 'Legionella in pneumonia (Haubitz)',
  subtitle: 'Ruling out Legionella in community-acquired pneumonia',
  question: 'For an adult with community-acquired pneumonia, can Legionella be ruled out?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'crp', type: 'check', label: 'C-reactive protein above 187 mg/L', ee: 'CREACT' },
    { id: 'na', type: 'check', label: 'Sodium below 133 mmol/L', ee: 'PLASMA' },
    { id: 'ldh', type: 'check', label: 'LDH above 225 U/L', ee: 'LACTATE' },
    { id: 'plt', type: 'check', label: 'Platelets below 171 × 10⁹/L', ee: 'PLATELET' },
    { id: 'fever', type: 'check', label: 'Fever above 39.4°C', ee: 'FEVER' },
    { id: 'cough', type: 'check', label: 'Dry (non-productive) cough', ee: 'COUGH' }
  ],
  compute(a) {
    const s = a.crp + a.na + a.ldh + a.plt + a.fever + a.cough;
    return s < 2 ? { score: { value: s, max: 6, label: 'Score' }, level: 1, headline: 'Low risk for Legionella', lines: ['With an overall risk of 2%, a score under 2 means a 0.4% risk.'] }
      : { score: { value: s, max: 6, label: 'Score' }, level: 3, headline: 'Legionella cannot be ruled out; consider antibiotics that cover it' };
  }
};
