// Anion gap (EE+ 109).
module.exports = {
  id: 'anion-gap',
  eeId: 109,
  title: 'Anion gap',
  subtitle: 'Serum anion gap',
  question: 'What is the serum anion gap?',
  inputs: [
    { id: 'na', type: 'number', label: 'Sodium', unit: 'mmol/L', min: 90, max: 200, step: 1, ee: 'IDC_EDIT_1' },
    { id: 'cl', type: 'number', label: 'Chloride', unit: 'mmol/L', min: 50, max: 160, step: 1, ee: 'IDC_EDIT_2' },
    { id: 'hco3', type: 'number', label: 'Bicarbonate', unit: 'mmol/L', min: 1, max: 60, step: 1, ee: 'IDC_EDIT_3' }
  ],
  footnote: 'Anion gap = Na − (Cl + HCO3).',
  compute(a) {
    return { headline: `Anion gap: ${a.na - (a.cl + a.hco3)} mmol/L`, lines: ['Normal 6 to 12 (the range varies by laboratory).'] };
  }
};
