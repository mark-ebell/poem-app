// Forns index: fibrosis in hepatitis C (Forns 2002; EE+ 228).
module.exports = {
  id: 'forns',
  eeId: 228,
  title: 'Forns index (hepatitis C fibrosis)',
  subtitle: 'Significant fibrosis (stage 2 to 4) in chronic hepatitis C',
  question: 'For a patient with chronic hepatitis C, how likely is significant fibrosis?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'Age_ID' },
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '× 10⁹/L', min: 10, max: 1000, step: 1, ee: 'Count_ID', note: 'Usual range 140 to 400.' },
    { id: 'ggt', type: 'number', label: 'GGT', unit: 'IU/L', min: 1, max: 2000, step: 1, ee: 'GGT_ID' },
    { id: 'chol', type: 'number', label: 'Cholesterol', unit: 'mg/dL', min: 50, max: 500, step: 1, ee: 'Cholesterol_ID' }
  ],
  compute(a) {
    const s = 7.811 - 3.131 * Math.log(a.platelets) + 0.781 * Math.log(a.ggt) + 3.467 * Math.log(a.age) - 0.014 * a.chol;
    const r = s < 4.21 ? [1, 'Low risk', '4%'] : s > 6.9 ? [4, 'High risk', '67%'] : [2, 'Moderate risk', '34%'];
    return { score: { value: Number(s.toFixed(2)), label: 'Forns index' }, level: r[0], headline: `${r[1]}: ${r[2]} probability of stage 2 to 4 fibrosis` };
  }
};
