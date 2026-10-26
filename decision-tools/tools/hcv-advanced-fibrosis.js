// Outcome in hepatitis C with advanced fibrosis or cirrhosis (van der Meer 2015; EE+ 534).
module.exports = {
  id: 'hcv-advanced-fibrosis',
  eeId: 534,
  title: 'Hepatitis C with advanced fibrosis: prognosis',
  subtitle: '5-year death and liver-related events in hepatitis C with Ishak 4 to 6 fibrosis',
  question: 'For a patient with chronic hepatitis C and compensated advanced fibrosis or cirrhosis, what are the 5-year risks of death and of liver-related events?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'AGE' },
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '× 10⁹/L', min: 10, max: 1000, step: 1, ee: 'PLATELET', note: 'Normal range 150 to 450.' },
    { id: 'ast', type: 'number', label: 'AST', unit: 'U/L', min: 1, max: 5000, step: 1, ee: 'AST' },
    { id: 'alt', type: 'number', label: 'ALT', unit: 'U/L', min: 1, max: 5000, step: 1, ee: 'ALT' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'g3', type: 'check', label: 'HCV genotype 3', ee: 'HCV' }
  ],
  compute(a) {
    const ratio = Math.log10(a.ast / a.alt);
    const death = 6 * Math.trunc(a.age) - a.platelets + 258.8 * ratio + 64.5 * a.male;
    const prog = 5.2 * Math.trunc(a.age) - 2.8 * a.platelets + 0.00517 * a.platelets * a.platelets + 358.2 * ratio + 83.7 * a.male + 60.6 * a.g3;
    const d = death < 87.1 ? 'Low risk: 0% (95% CI 0 to 3%)' : death < 221.2 ? 'Intermediate risk: 7.2% (95% CI 2.9 to 11.5%)' : 'High risk: 22.2% (95% CI 12.6 to 31.8%)';
    const p = prog < -91.9 ? 'Low risk: 1.6% (95% CI 0.0 to 4.7%)' : prog < 61 ? 'Intermediate risk: 13.8% (95% CI 8.1 to 19.5%)' : 'High risk: 53.1% (95% CI 41.3 to 64.9%)';
    return { headline: `5-year mortality: ${d}`, lines: [`5-year death, transplant, liver failure or hepatocellular cancer: ${p}`] };
  }
};
