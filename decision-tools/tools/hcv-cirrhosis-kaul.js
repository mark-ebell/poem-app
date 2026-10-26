// Cirrhosis in hepatitis C (Kaul 2002; EE+ 196).
module.exports = {
  id: 'hcv-cirrhosis-kaul',
  eeId: 196,
  title: 'Hepatitis C: probability of cirrhosis (Kaul)',
  subtitle: 'Cirrhosis in chronic hepatitis C',
  question: 'For a patient with chronic hepatitis C, how likely is cirrhosis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'spider', type: 'check', label: 'Spider nevi', ee: 'IDC_CHECKBOX_1' },
    { id: 'ast', type: 'check', label: 'AST above 40 IU/L', ee: 'IDC_CHECKBOX_2' },
    { id: 'platelets', type: 'check', label: 'Platelets below 140,000/µL', ee: 'IDC_CHECKBOX_3' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const x = 7.962491 - 3.0947 * a.spider - 3.020743 * a.ast - 4.260415 * a.platelets - 3.962053 * a.male;
    return { headline: `Probability of cirrhosis: ${(100 / (1 + Math.exp(x))).toFixed(2)}%` };
  }
};
