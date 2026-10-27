// Polymyalgia rheumatica activity score (PMR-AS; Leeb 2004; EE+ 366). EE+ cut each entry to a whole
// number (a CRP of 2.8 counted as 2); here the values are used as entered.
module.exports = {
  id: 'pmr-activity',
  eeId: 366,
  title: 'PMR disease activity score (PMR-AS)',
  subtitle: 'Disease activity in polymyalgia rheumatica',
  question: 'For a patient with polymyalgia rheumatica, how active is the disease?',
  inputs: [
    { id: 'crp', type: 'number', label: 'C-reactive protein', unit: 'mg/dL', min: 0, max: 50, step: 0.1, ee: 'TXT_CRP' },
    { id: 'pain', type: 'number', label: 'Patient pain', unit: '0 to 10', min: 0, max: 10, step: 0.1, ee: 'TXT_Pain' },
    { id: 'md', type: 'number', label: 'Physician global assessment', unit: '0 to 10', min: 0, max: 10, step: 0.1, ee: 'TXT_Assess' },
    { id: 'stiff', type: 'number', label: 'Morning stiffness', unit: 'minutes', min: 0, max: 1440, step: 1, ee: 'TXT_Stiff' },
    { id: 'eul', type: 'choice', label: 'Elevation of the upper limbs', ee: 'CMB_EUL', options: [{ label: 'Above the shoulder girdle' }, { label: 'Up to the shoulder girdle' }, { label: 'Below the shoulder girdle' }, { label: 'None' }] }
  ],
  footnote: 'PMR-AS = CRP (mg/dL) + patient pain + physician assessment + morning stiffness (minutes) × 0.1 + elevation of the upper limbs (0 to 3).',
  compute(a) {
    const s = a.crp + a.pain + a.md + a.stiff / 10 + a.eul;
    const [level, label] = s < 7 ? [1, 'Low'] : s <= 17 ? [2, 'Moderate'] : [3, 'High'];
    return { score: { value: Number(s.toFixed(1)), label: 'PMR-AS' }, level, headline: `${label} disease activity` };
  }
};
