// MDRD 4-variable GFR equation, IDMS-traceable (Levey 2006; EE+ 357).
module.exports = {
  id: 'mdrd4',
  eeId: 357,
  title: 'Creatinine clearance (MDRD 4 variable)',
  subtitle: 'Estimated GFR from creatinine, age, sex and race',
  question: 'For an adult, what is the estimated GFR by the 4-variable MDRD equation?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Creatinine units', ee: 'UNITS', options: [{ label: 'mg/dL' }, { label: 'µmol/L' }] },
    { id: 'creatMg', type: 'number', label: 'Serum creatinine', unit: 'mg/dL', min: 0.2, max: 20, step: 0.01, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'creatUmol', type: 'number', label: 'Serum creatinine', unit: 'µmol/L', min: 18, max: 1800, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, ee: 'IDC_EDIT_2' },
    { id: 'black', type: 'check', label: 'Black or African American', ee: 'IDC_CHECKBOX_1' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_2' }
  ],
  footnote: 'GFR = 175 × creatinine^−1.154 × age^−0.203, × 0.742 if female, × 1.21 if Black.',
  compute(a) {
    const cr = a.units === 1 ? a.creatUmol / 88.4 : a.creatMg;
    let g = 175 * Math.pow(cr, -1.154) * Math.pow(a.age, -0.203);
    if (a.black) g *= 1.21;
    if (a.female) g *= 0.742;
    return { headline: `Estimated GFR ${Math.round(g * 10) / 10} mL/min per 1.73 m²` };
  }
};
