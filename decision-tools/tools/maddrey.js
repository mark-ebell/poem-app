// Maddrey discriminant function (modified) for alcoholic hepatitis (Carithers 1989; EE+ 341). EE+ cut the
// prothrombin times to whole seconds; here they are used as entered.
module.exports = {
  id: 'maddrey',
  eeId: 341,
  title: 'Alcoholic hepatitis prognosis (Maddrey discriminant function)',
  subtitle: 'Modified discriminant function in alcoholic hepatitis',
  question: 'For a patient hospitalized with alcoholic hepatitis, what is the discriminant function?',
  inputs: [
    { id: 'pt', type: 'number', label: "Patient's prothrombin time", unit: 'seconds', min: 5, max: 120, step: 0.1, ee: 'patientPT' },
    { id: 'control', type: 'number', label: 'Control prothrombin time', unit: 'seconds', min: 5, max: 30, step: 0.1, ee: 'controlPT' },
    { id: 'units', type: 'choice', label: 'Bilirubin units', ee: 'UNIT_1', options: [{ label: 'mg/dL' }, { label: 'µmol/L' }] },
    { id: 'biliMg', type: 'number', label: 'Bilirubin', unit: 'mg/dL', min: 0.1, max: 80, step: 0.1, ee: 'bili', when: a => a.units === 0 },
    { id: 'biliUmol', type: 'number', label: 'Bilirubin', unit: 'µmol/L', min: 2, max: 1400, step: 1, ee: 'bili', when: a => a.units === 1 }
  ],
  footnote: 'Discriminant function = 4.6 × (patient PT − control PT) + bilirubin (mg/dL). A score of 32 or more indicates a high risk of death.',
  compute(a) {
    const s = 4.6 * (a.pt - a.control) + (a.units === 0 ? a.biliMg : a.biliUmol / 17.1);
    return { score: { value: Math.round(s * 10) / 10, label: 'Discriminant function' }, level: s >= 32 ? 4 : 1, headline: s >= 32 ? 'High-risk patient' : 'Low-risk patient' };
  }
};
