// FIB-4 index: advanced fibrosis (validation in hepatitis B: Mallet 2009; EE+ 430). EE+ left out the square
// root of ALT; FIB-4 = (age × AST) / (platelets × √ALT).
module.exports = {
  id: 'fib4',
  eeId: 430,
  title: 'FIB-4 index',
  subtitle: 'Advanced liver fibrosis (F3 or F4)',
  question: 'For a patient with chronic liver disease, how likely is advanced fibrosis?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 120, step: 1, ee: 'TXT_Age' },
    { id: 'ast', type: 'number', label: 'AST', unit: 'U/L', min: 1, max: 5000, step: 1, ee: 'TXT_AST' },
    { id: 'alt', type: 'number', label: 'ALT', unit: 'U/L', min: 1, max: 5000, step: 1, ee: 'TXT_ALT' },
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '× 10⁹/L', min: 1, max: 1000, step: 1, ee: 'TXT_Plagelets', note: 'Normal range 150 to 400.' }
  ],
  compute(a) {
    const f = (a.age * a.ast) / (a.platelets * Math.sqrt(a.alt));
    return f <= 1.45
      ? { score: { value: Number(f.toFixed(2)), label: 'FIB-4' }, level: 1, headline: 'Low risk for advanced fibrosis', lines: ['11 of 80 (14%) had F3 or F4 fibrosis.'] }
      : { score: { value: Number(f.toFixed(2)), label: 'FIB-4' }, level: 3, headline: 'High risk for advanced fibrosis', lines: ['30 of 58 (52%) had F3 or F4 fibrosis.'] };
  }
};
