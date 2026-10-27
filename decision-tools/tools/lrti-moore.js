// Adverse outcome in adults with lower respiratory tract infection in primary care (Moore 2019; EE+ 619).
module.exports = {
  id: 'lrti-moore',
  eeId: 619,
  title: 'Lower respiratory infection prognosis (Moore)',
  subtitle: 'Pneumonia, hospitalization or death after acute cough in primary care',
  question: 'For an adult outpatient with acute cough not referred to hospital, what is the risk of a later adverse outcome?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    ...[['sat', 'Oxygen saturation below 95%', 'cb1'], ['age', 'Age 65 or older', 'cb2'], ['bp', 'Systolic BP below 90 or diastolic below 60 mm Hg', 'cb3'], ['temp', 'Temperature above 37.8°C (100.0°F)', 'cb4'],
      ['comorbid', 'Any comorbidity', 'cb5'], ['coryza', 'No coryza', 'cb6'], ['severity', 'Severity rated above 5 out of 10', 'cb7'], ['chest', 'Chest pain', 'cb8']]
      .map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  footnote: 'Not yet prospectively validated.',
  compute(a) {
    const s = a.sat + a.age + a.bp + a.temp + a.comorbid + a.coryza + a.severity + a.chest;
    return s <= 2 ? { score: { value: s, max: 8, label: 'Score' }, level: 1, headline: 'Low risk: 72 of 14,457 (0.5%) had an adverse outcome (later pneumonia, hospitalization or death)' }
      : s <= 4 ? { score: { value: s, max: 8, label: 'Score' }, level: 2, headline: 'Moderate risk: 163 of 8154 (2.0%) had an adverse outcome' }
      : { score: { value: s, max: 8, label: 'Score' }, level: 4, headline: 'High risk: 57 of 1005 (5.7%) had an adverse outcome' };
  }
};
