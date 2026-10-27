// HALT-C cirrhosis model in hepatitis C (Lok 2005; EE+ 499). EE+ compared the log-odds with 0.3 and 0.6;
// here the log-odds is converted to a probability and Lok's cut-offs (0.2 and 0.5) are used (Mark Ebell, 2026-10-26).
module.exports = {
  id: 'halt-c',
  eeId: 499,
  title: 'HALT-C cirrhosis model (hepatitis C)',
  subtitle: 'Cirrhosis in chronic hepatitis C from routine tests (Lok index)',
  question: 'For a patient with chronic hepatitis C, how likely is cirrhosis?',
  inputs: [
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '× 1000/µL', min: 1, max: 999, step: 1, ee: 'PLATELETS', note: 'Normal range 150 to 450.' },
    { id: 'ast', type: 'number', label: 'AST', unit: 'U/L', min: 1, max: 500, step: 1, ee: 'AST' },
    { id: 'alt', type: 'number', label: 'ALT', unit: 'U/L', min: 1, max: 500, step: 1, ee: 'ALT' },
    { id: 'inr', type: 'number', label: 'INR', min: 0.5, max: 10, step: 0.01, ee: 'INR' }
  ],
  compute(a) {
    const L = -5.56 - 0.0089 * a.platelets + 1.26 * (a.ast / a.alt) + 5.27 * a.inr, p = 100 / (1 + Math.exp(-L));
    const out = { score: { value: Number(p.toFixed(1)), label: 'Probability of cirrhosis (%)' } };
    if (p < 20) return { ...out, level: 1, headline: `Cirrhosis unlikely (probability ${p.toFixed(0)}%)`, lines: ['Below 20% misclassified 7.8% of patients with cirrhosis.'] };
    if (p <= 50) return { ...out, level: 2, headline: `Indeterminate (probability ${p.toFixed(0)}%)` };
    return { ...out, level: 3, headline: `Cirrhosis likely (probability ${p.toFixed(0)}%)`, lines: ['Above 50% misclassified 14.8% of patients without cirrhosis.'] };
  }
};
