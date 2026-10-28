// Alveolar-arterial oxygen gradient (EE+ 117).
const r2 = x => Math.round(x * 100) / 100;
module.exports = {
  id: 'aa-gradient',
  eeId: 117,
  title: 'A-a gradient',
  subtitle: 'Alveolar-arterial oxygen gradient',
  question: 'What is the A-a oxygen gradient, and is it higher than expected for age?',
  inputs: [
    { id: 'fio2', type: 'number', label: 'FiO₂', unit: '%', min: 21, max: 100, ee: 'IDC_EDIT_1' },
    { id: 'pb', type: 'number', label: 'Barometric pressure', unit: 'mm Hg', min: 400, max: 800, ee: 'IDC_EDIT_2', note: '760 at sea level.' },
    { id: 'paco2', type: 'number', label: 'Measured PaCO₂', unit: 'mm Hg', min: 10, max: 150, ee: 'IDC_EDIT_3' },
    { id: 'pao2', type: 'number', label: 'Measured PaO₂', unit: 'mm Hg', min: 20, max: 600, ee: 'IDC_EDIT_4' },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 1, max: 110, ee: 'IDC_EDIT_5' }
  ],
  footnote: 'A-a gradient = FiO₂ × (barometric pressure − 47) − PaCO₂ ÷ 0.8 − PaO₂. Upper limit of normal = age ÷ 4 + 2.5.',
  compute(a) {
    const g = (a.fio2 / 100) * (a.pb - 47) - a.paco2 / 0.8 - a.pao2, n = a.age * 0.25 + 2.5;
    return { level: g > n ? 3 : 1, headline: `A-a gradient ${r2(g)} mm Hg (normal ${r2(n)} or less)`, lines: g > n ? ['Consider diffusion defect, V-Q mismatch, or R-L shunt.'] : [] };
  }
};
