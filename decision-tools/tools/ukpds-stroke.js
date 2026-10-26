// UKPDS stroke risk engine for type 2 diabetes (Kothari 2002; EE+ 211).
module.exports = {
  id: 'ukpds-stroke',
  eeId: 211,
  title: 'UKPDS stroke risk engine',
  subtitle: 'Risk of a first stroke in type 2 diabetes',
  question: 'For a patient with type 2 diabetes and no previous stroke, what are the 5- and 10-year risks of stroke?',
  inputs: [
    { id: 'duration', type: 'number', label: 'Years since diabetes was diagnosed', unit: 'years', min: 0, max: 60, step: 0.5, ee: 'DURATION' },
    { id: 'ageDx', type: 'number', label: 'Age when diabetes was diagnosed', unit: 'years', min: 18, max: 100, step: 1, ee: 'AGE' },
    { id: 'tc', type: 'number', label: 'Total cholesterol', unit: 'mg/dL or mmol/L', min: 1, max: 500, step: 0.1, ee: 'TOTAL', note: 'Use the same units for total and HDL cholesterol; only their ratio is used.' },
    { id: 'hdl', type: 'number', label: 'HDL cholesterol', unit: 'mg/dL or mmol/L', min: 0.2, max: 200, step: 0.1, ee: 'HDL' },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 70, max: 260, step: 1, ee: 'SYSTOLIC' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_1' },
    { id: 'smoker', type: 'check', label: 'Smoking when diabetes was diagnosed', ee: 'IDC_CHECKBOX_2' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const q = 0.00186 * Math.pow(1.092, a.ageDx - 55) * Math.pow(0.7, +a.female) * Math.pow(1.547, +a.smoker) * Math.pow(8.554, +a.af)
      * Math.pow(1.122, (a.sbp - 135.5) / 10) * Math.pow(1.138, a.tc / a.hdl - 5.11);
    const risk = t => (100 * (1 - Math.exp(-q * Math.pow(1.145, a.duration) * (1 - Math.pow(1.145, t)) / (1 - 1.145)))).toFixed(1);
    return { headline: `10-year risk of stroke: ${risk(10)}%`, lines: [`5-year risk of stroke: ${risk(5)}%`] };
  }
};
