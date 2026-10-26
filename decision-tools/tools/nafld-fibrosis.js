// NAFLD fibrosis score (Angulo 2007; EE+ 576). Wording as in EE+.
module.exports = {
  id: 'nafld-fibrosis',
  eeId: 576,
  title: 'NAFLD fibrosis score',
  subtitle: 'Advanced fibrosis in nonalcoholic fatty liver disease',
  question: 'For a patient with suspected nonalcoholic fatty liver disease, how likely is advanced fibrosis?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'txt_Age' },
    { id: 'bmi', type: 'number', label: 'BMI', unit: 'kg/m²', min: 10, max: 99, step: 0.1, ee: 'txt_BMI' },
    { id: 'ast', type: 'number', label: 'AST', unit: 'IU/L', min: 1, max: 2000, step: 1, ee: 'txt_AST' },
    { id: 'alt', type: 'number', label: 'ALT', unit: 'IU/L', min: 1, max: 2000, step: 1, ee: 'txt_ALT' },
    { id: 'albumin', type: 'number', label: 'Albumin', unit: 'g/dL', min: 1, max: 7, step: 0.1, ee: 'txt_Albumin', note: 'Normal range 3.5 to 5.5.' },
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '× 10⁹/L', min: 1, max: 3000, step: 1, ee: 'txt_Platelets', note: 'Normal range 150 to 450.' },
    { type: 'heading', label: 'Check if present' },
    { id: 'dm', type: 'check', label: 'Impaired fasting glucose or diabetes', ee: 'cb1' }
  ],
  compute(a) {
    const s = Number((-1.675 + 0.037 * a.age + 0.094 * a.bmi + 1.13 * a.dm + 0.99 * (a.ast / a.alt) - 0.013 * a.platelets - 0.66 * a.albumin).toFixed(3));
    if (s < -1.455) return { score: { value: s, label: 'Score' }, level: 1, headline: 'Low likelihood of significant fibrosis; biopsy unlikely to be helpful' };
    if (s <= 0.676) return { score: { value: s, label: 'Score' }, level: 2, headline: 'Moderate likelihood of significant fibrosis', lines: ['Consider additional tests such as transient elastography (FibroScan) and fibrosis biomarkers to identify patients for biopsy.'] };
    return { score: { value: s, label: 'Score' }, level: 4, headline: 'High likelihood of significant fibrosis (F3 to F4)', lines: ['Refer for liver biopsy.'] };
  }
};
