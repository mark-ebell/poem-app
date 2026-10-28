// Ventilation index (EE+ 225).
module.exports = {
  id: 'ventilation-index',
  eeId: 225,
  title: 'Ventilation index',
  subtitle: 'Ventilation index for mechanically ventilated patients',
  question: 'For a patient on a ventilator, what is the ventilation index?',
  inputs: [
    { id: 'rr', type: 'number', label: 'Ventilator respiratory rate', unit: 'breaths/min', min: 1, max: 80, ee: 'IDC_EDIT_1' },
    { id: 'pip', type: 'number', label: 'Peak inspiratory pressure', unit: 'cm H₂O', min: 1, max: 80, ee: 'IDC_EDIT_2' },
    { id: 'peep', type: 'number', label: 'Positive end-expiratory pressure', unit: 'cm H₂O', min: 0, max: 30, ee: 'IDC_EDIT_3' },
    { id: 'pco2', type: 'number', label: 'PaCO₂', unit: 'mm Hg', min: 10, max: 150, ee: 'IDC_EDIT_4' }
  ],
  footnote: 'Ventilation index = respiratory rate × (peak inspiratory pressure − PEEP) × PaCO₂ ÷ 1000. A higher index is associated with poorer ventilation.',
  compute(a) {
    const v = (a.rr * (a.pip - a.peep) * a.pco2) / 1000;
    return { headline: `Ventilation index ${Math.round(v * 10) / 10}` };
  }
};
