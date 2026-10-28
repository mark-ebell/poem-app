// Bacteremia in older patients with community-acquired pneumonia (Metersky 2004; EE+ 265).
const { count } = require('../lib');
module.exports = {
  id: 'bacteremia-cap-metersky',
  eeId: 265,
  title: 'Bacteremia risk in older patients with CAP',
  subtitle: 'Positive blood cultures in community-acquired pneumonia',
  question: 'For an older patient with community-acquired pneumonia, what is the probability of a positive blood culture?',
  inputs: [
    { id: 'abx', type: 'check', label: 'Antibiotics given before blood cultures', ee: 'IDC_CHECKBOX_1' },
    { id: 'liver', type: 'check', label: 'History of chronic liver disease', ee: 'IDC_CHECKBOX_2' },
    { id: 'sbp', type: 'check', label: 'Systolic BP under 90 mm Hg', ee: 'IDC_CHECKBOX_3' },
    { id: 'temp', type: 'check', label: 'Temperature under 35 °C (95 °F) or 40 °C (104 °F) or more', ee: 'IDC_CHECKBOX_4' },
    { id: 'pulse', type: 'check', label: 'Pulse 125/min or more', ee: 'IDC_CHECKBOX_5' },
    { id: 'bun', type: 'check', label: 'BUN 30 mg/dL (11 mmol/L) or more', ee: 'IDC_CHECKBOX_6' },
    { id: 'na', type: 'check', label: 'Sodium under 130 mmol/L', ee: 'IDC_CHECKBOX_7' },
    { id: 'wbc', type: 'check', label: 'WBC under 5000/mm³ or over 20,000/mm³', ee: 'IDC_CHECKBOX_8' }
  ],
  footnote: 'Unvalidated recommendation: no blood cultures for low risk; 1 for moderate; 2 for high.',
  compute(a) {
    const n = count(a, ['liver', 'sbp', 'temp', 'pulse', 'bun', 'na', 'wbc']);
    const [level, h] = n >= 2 ? [4, 'High risk (16%)'] : a.abx ? (n === 0 ? [1, 'Low risk (3%)'] : [2, 'Moderate risk (5%)']) : (n === 0 ? [2, 'Moderate risk (5%)'] : [3, 'High risk (9%)']);
    return { level, headline: `Probability of a positive blood culture: ${h}` };
  }
};
