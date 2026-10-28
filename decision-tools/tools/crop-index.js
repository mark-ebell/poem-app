// CROP index (Yang and Tobin 1991; EE+ 236). EE+ estimated alveolar PO2 as FiO2 × 713 − PaCO2, leaving
// out the respiratory quotient; here PAO2 = FiO2 × 713 − PaCO2 / 0.8.
module.exports = {
  id: 'crop-index',
  eeId: 236,
  title: 'CROP index',
  subtitle: 'Compliance, rate, oxygenation and pressure index for ventilator weaning',
  question: 'For an adult on a ventilator, is successful weaning predicted?',
  inputs: [
    { id: 'cd', type: 'number', label: 'Dynamic compliance', unit: 'mL/cm H₂O', min: 1, max: 200, ee: 'IDC_EDIT_1' },
    { id: 'mip', type: 'number', label: 'Maximal inspiratory pressure (as a positive number)', unit: 'cm H₂O', min: 1, max: 200, ee: 'IDC_EDIT_2' },
    { id: 'pao2', type: 'number', label: 'PaO₂ (arterial)', unit: 'mm Hg', min: 20, max: 600, ee: 'IDC_EDIT_3' },
    { id: 'rr', type: 'number', label: 'Respiratory rate (spontaneous)', unit: 'breaths/min', min: 1, max: 80, ee: 'IDC_EDIT_4' },
    { id: 'fio2', type: 'number', label: 'FiO₂', min: 0.21, max: 1, step: 0.01, ee: 'IDC_EDIT_5' },
    { id: 'paco2', type: 'number', label: 'PaCO₂', unit: 'mm Hg', min: 10, max: 150, ee: 'IDC_EDIT_6' }
  ],
  footnote: 'CROP = dynamic compliance × maximal inspiratory pressure × (PaO₂ ÷ PAO₂) ÷ respiratory rate, with PAO₂ = FiO₂ × 713 − PaCO₂ ÷ 0.8. An index of 13 or more is 81% sensitive and 57% specific (71% PPV, 70% NPV given a 56% pretest probability). Adults only.',
  compute(a) {
    const PAO2 = a.fio2 * 713 - a.paco2 / 0.8;
    if (PAO2 <= 0) return { headline: 'Check FiO₂ and PaCO₂: the estimated alveolar PO₂ is not positive' };
    const c = (a.cd * a.mip * (a.pao2 / PAO2)) / a.rr;
    return { score: { value: Math.round(c * 10) / 10, label: 'CROP index' }, lines: [{ label: 'Alveolar PO₂ (PAO₂)', value: `${Math.round(PAO2)} mm Hg` }], ...(c >= 13 ? { level: 1, headline: 'Successful weaning predicted (cut-off 13)' } : { level: 3, headline: 'Unsuccessful weaning predicted (cut-off 13)' }) };
  }
};
