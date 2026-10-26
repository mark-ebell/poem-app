// 5-year cardiac and non-cardiac mortality in known CAD (Dankner; EE+ 207).
const CARDIAC = [1.7, 2.9, 5.4, 7.8, 11.2, 22.2];
const NONCARDIAC = [1.9, 2.7, 4.1, 5.9, 9.0, 15.5];

module.exports = {
  id: 'cad-mortality',
  eeId: 207,
  title: 'Mortality in known coronary artery disease',
  subtitle: '5-year cardiac and non-cardiac mortality (Dankner)',
  question: 'For a patient aged 45 to 74 with known CAD, what is the 5-year risk of death?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'IDC_CHECKBOX_1' },
    { id: 'mi', type: 'check', label: 'Past myocardial infarction', ee: 'IDC_CHECKBOX_2' },
    { id: 'nyha', type: 'check', label: 'NYHA class II, III or IV (any symptoms)', ee: 'IDC_CHECKBOX_3' },
    { id: 'stroke', type: 'check', label: 'History of stroke', ee: 'IDC_CHECKBOX_4' },
    { id: 'smoker', type: 'check', label: 'Current smoker', ee: 'IDC_CHECKBOX_5' },
    { id: 'glucose', type: 'check', label: 'Serum glucose above 140 mg/dL', ee: 'IDC_CHECKBOX_6' },
    { id: 'pulse', type: 'check', label: 'Resting pulse above 80 beats/min', ee: 'IDC_CHECKBOX_7' },
    { id: 'chol', type: 'check', label: 'Total cholesterol above 200 mg/dL', ee: 'IDC_CHECKBOX_8' },
    { id: 'hdl', type: 'check', label: 'HDL cholesterol below 35 mg/dL (cardiac mortality only)', ee: 'IDC_CHECKBOX_9' }
  ],
  compute(a) {
    const n = ['age', 'mi', 'nyha', 'stroke', 'smoker', 'glucose', 'pulse', 'chol'].filter(k => a[k]).length;
    const nc = n + (a.hdl ? 1 : 0);
    return {
      score: { value: nc, max: 9, label: 'Risk factors' },
      level: nc <= 1 ? 1 : nc <= 3 ? 2 : nc === 4 ? 3 : 4,
      lines: [{ label: 'Cardiac mortality (5 years)', value: `${CARDIAC[Math.min(nc, 5)].toFixed(1)}%` },
        { label: 'Non-cardiac mortality (5 years)', value: `${NONCARDIAC[Math.min(n, 5)].toFixed(1)}%` }]
    };
  }
};
