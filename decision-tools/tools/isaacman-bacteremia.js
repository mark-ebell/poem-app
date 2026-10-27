// Bacteremia in febrile children 3 to 36 months (Isaacman 2000; EE+ 253).
module.exports = {
  id: 'isaacman-bacteremia',
  eeId: 253,
  title: 'Bacteremia risk, age 3 to 36 months (Isaacman)',
  subtitle: 'Occult bacteremia in febrile young children',
  question: 'For a febrile child 3 to 36 months old, what is the risk of bacteremia?',
  inputs: [
    { id: 'anc', type: 'number', label: 'Absolute neutrophil count', unit: '× 1000/µL', min: 0.1, max: 200, step: 0.1, ee: 'IDC_EDIT_1', note: 'In thousands: enter 23,400 as 23.4.' },
    { id: 'units', type: 'choice', label: 'Temperature units', ee: 'UNITS', options: [{ label: '°F' }, { label: '°C' }] },
    { id: 'tempF', type: 'number', label: 'Temperature', unit: '°F', min: 86, max: 113, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'tempC', type: 'number', label: 'Temperature', unit: '°C', min: 30, max: 45, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 },
    { type: 'heading', label: 'Check if female' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_1' }
  ],
  footnote: 'Overall risk of bacteremia was 7% in the study population (1.6% in the validation set). A 5% cut-off was 87% sensitive; 7% was 76% sensitive.',
  compute(a) {
    const c = a.units === 0 ? ((a.tempF - 32) * 5) / 9 : a.tempC;
    const x = 0.1673 * a.anc + 0.2006 * c + 0.8434 * a.female - 12.454;
    return { headline: `Risk of bacteremia: ${(100 / (1 + Math.exp(-x))).toFixed(1)}%` };
  }
};
