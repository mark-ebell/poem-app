// MDRD 6-variable GFR equation (Levey 1999; EE+ 278).
module.exports = {
  id: 'mdrd6',
  eeId: 278,
  title: 'Creatinine clearance (MDRD 6 variable)',
  subtitle: 'Estimated GFR from creatinine, age, urea nitrogen, albumin, sex and race',
  question: 'For an adult with kidney disease, what is the estimated GFR by the 6-variable MDRD equation?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Conventional (mg/dL, g/dL)' }, { label: 'SI (µmol/L, mmol/L, g/L)' }] },
    { id: 'creatMg', type: 'number', label: 'Serum creatinine', unit: 'mg/dL', min: 0.2, max: 20, step: 0.01, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'creatUmol', type: 'number', label: 'Serum creatinine', unit: 'µmol/L', min: 18, max: 1800, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, ee: 'IDC_EDIT_2' },
    { id: 'bunMg', type: 'number', label: 'Serum urea nitrogen', unit: 'mg/dL', min: 1, max: 200, ee: 'IDC_EDIT_3', when: a => a.units === 0 },
    { id: 'bunMmol', type: 'number', label: 'Serum urea', unit: 'mmol/L', min: 0.4, max: 70, step: 0.1, ee: 'IDC_EDIT_3', when: a => a.units === 1 },
    { id: 'albG', type: 'number', label: 'Serum albumin', unit: 'g/dL', min: 1, max: 6, step: 0.1, ee: 'IDC_EDIT_4', when: a => a.units === 0 },
    { id: 'albGL', type: 'number', label: 'Serum albumin', unit: 'g/L', min: 10, max: 60, ee: 'IDC_EDIT_4', when: a => a.units === 1 },
    { id: 'black', type: 'check', label: 'Black or African American', ee: 'IDC_CHECKBOX_1' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_2' }
  ],
  footnote: 'GFR = 170 × creatinine^−0.999 × age^−0.176 × urea nitrogen^−0.170 × albumin^0.318, × 0.762 if female, × 1.180 if Black.',
  compute(a) {
    const si = a.units === 1;
    const cr = si ? a.creatUmol / 88.4 : a.creatMg, bun = si ? a.bunMmol / 0.357 : a.bunMg, alb = si ? a.albGL / 10 : a.albG;
    let g = 170 * Math.pow(cr, -0.999) * Math.pow(a.age, -0.176) * Math.pow(bun, -0.17) * Math.pow(alb, 0.318);
    if (a.black) g *= 1.18;
    if (a.female) g *= 0.762;
    return { headline: `Estimated GFR ${Math.round(g * 10) / 10} mL/min per 1.73 m²` };
  }
};
