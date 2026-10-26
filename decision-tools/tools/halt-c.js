// HALT-C cirrhosis model in hepatitis C (Lok 2005; EE+ 499). Score and cut-offs as in EE+.
module.exports = {
  id: 'halt-c',
  eeId: 499,
  title: 'HALT-C cirrhosis model (hepatitis C)',
  subtitle: 'Cirrhosis in chronic hepatitis C from routine tests',
  question: 'For a patient with chronic hepatitis C, how likely is cirrhosis?',
  inputs: [
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '× 1000/µL', min: 1, max: 999, step: 1, ee: 'PLATELETS', note: 'Normal range 150 to 450.' },
    { id: 'ast', type: 'number', label: 'AST', unit: 'U/L', min: 1, max: 500, step: 1, ee: 'AST' },
    { id: 'alt', type: 'number', label: 'ALT', unit: 'U/L', min: 1, max: 500, step: 1, ee: 'ALT' },
    { id: 'inr', type: 'number', label: 'INR', min: 0.5, max: 10, step: 0.01, ee: 'INR' }
  ],
  compute(a) {
    const s = -5.56 - 0.0089 * a.platelets + 1.26 * (a.ast / a.alt) + 5.27 * a.inr;
    return s < 0.3 ? { score: { value: Number(s.toFixed(2)), label: 'Score' }, level: 1, headline: 'Low risk: 5 of 191 (2.6%) had cirrhosis' }
      : s <= 0.6 ? { score: { value: Number(s.toFixed(2)), label: 'Score' }, level: 2, headline: 'Moderate risk: 19 of 79 (24%) had cirrhosis' }
      : { score: { value: Number(s.toFixed(2)), label: 'Score' }, level: 3, headline: 'High risk: 16 of 35 (46%) had cirrhosis' };
  }
};
