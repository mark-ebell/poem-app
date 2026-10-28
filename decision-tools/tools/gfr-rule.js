// Mayo quadratic GFR equation (Rule 2004; EE+ 400). EE+ converted µmol/L with 76.26 instead of 88.4
// and did not use 0.8 mg/dL for lower creatinine values, as the published equation does.
module.exports = {
  id: 'gfr-rule',
  eeId: 400,
  title: 'GFR estimation (quadratic equation)',
  subtitle: 'Mayo Clinic quadratic equation',
  question: 'For an adult, what is the estimated GFR by the Mayo quadratic equation?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Creatinine units', ee: 'RAD_SI', eeIndex: [1, 0], options: [{ label: 'mg/dL' }, { label: 'µmol/L' }] },
    { id: 'creatMg', type: 'number', label: 'Serum creatinine', unit: 'mg/dL', min: 0.2, max: 20, step: 0.01, ee: 'TXT_Creat', when: a => a.units === 0 },
    { id: 'creatUmol', type: 'number', label: 'Serum creatinine', unit: 'µmol/L', min: 18, max: 1800, ee: 'TXT_Creat', when: a => a.units === 1 },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, ee: 'TXT_Age' },
    { id: 'female', type: 'check', label: 'Female', ee: 'CHK_Female' }
  ],
  footnote: 'GFR = exp(1.911 + 5.249/creatinine − 2.114/creatinine² − 0.00686 × age − 0.205 if female), with creatinine in mg/dL; a creatinine below 0.8 mg/dL is taken as 0.8.',
  compute(a) {
    const cr = Math.max(0.8, a.units === 1 ? a.creatUmol / 88.4 : a.creatMg);
    const g = Math.exp(1.911 + 5.249 / cr - 2.114 / (cr * cr) - 0.00686 * a.age - (a.female ? 0.205 : 0));
    return { headline: `Estimated GFR ${Math.round(g)} mL/min per 1.73 m²` };
  }
};
