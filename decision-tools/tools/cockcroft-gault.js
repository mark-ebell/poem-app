// Cockcroft-Gault creatinine clearance (EE+ 100).
module.exports = {
  id: 'cockcroft-gault',
  eeId: 100,
  title: 'Creatinine clearance (Cockcroft-Gault)',
  subtitle: 'Estimated creatinine clearance from weight, age, sex and serum creatinine',
  question: 'For an adult, what is the estimated creatinine clearance?',
  inputs: [
    { id: 'weight', type: 'number', label: 'Weight', unit: 'kg', min: 20, max: 250, step: 0.1, ee: 'IDC_EDIT_1' },
    { id: 'creat', type: 'number', label: 'Serum creatinine', unit: 'mg/dL', min: 0.2, max: 20, step: 0.01, ee: 'IDC_EDIT_2' },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, ee: 'IDC_EDIT_3' },
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'IDC_RADIO_1', options: [{ label: 'Male' }, { label: 'Female' }] }
  ],
  footnote: 'Creatinine clearance = (140 − age) × weight ÷ (72 × serum creatinine), × 0.85 in women.',
  compute(a) {
    const c = ((140 - a.age) / (a.creat * 72)) * a.weight * (a.sex === 1 ? 0.85 : 1);
    return { headline: `Estimated creatinine clearance ${Math.round(c * 100) / 100} mL/min` };
  }
};
