// ACC/AHA Pooled Cohort Equations: 10-year ASCVD risk (Goff 2013; EE+ 510).
const L = Math.log;
const MODELS = {
  whiteMale: [0.9144, 61.18, (a, la, lc, lh, ls) => 12.344 * la + 11.853 * lc - 2.664 * la * lc - 7.99 * lh + 1.769 * la * lh + (a.treated ? 1.797 : 1.764) * ls + (a.smoker ? 7.837 - 1.795 * la : 0) + (a.dm ? 0.658 : 0)],
  whiteFemale: [0.9655, -29.18, (a, la, lc, lh, ls) => -29.799 * la + 4.884 * la * la + 13.54 * lc - 3.114 * la * lc - 13.578 * lh + 3.149 * la * lh + (a.treated ? 2.019 : 1.957) * ls + (a.smoker ? 7.574 - 1.665 * la : 0) + (a.dm ? 0.661 : 0)],
  blackMale: [0.8954, 19.54, (a, la, lc, lh, ls) => 2.469 * la + 0.302 * lc - 0.307 * lh + (a.treated ? 1.916 : 1.809) * ls + (a.smoker ? 0.549 : 0) + (a.dm ? 0.645 : 0)],
  blackFemale: [0.9533, 86.61, (a, la, lc, lh, ls) => 17.114 * la + 0.94 * lc - 18.92 * lh + 4.475 * la * lh + (a.treated ? 29.291 * ls - 6.432 * la * ls : 27.82 * ls - 6.087 * la * ls) + (a.smoker ? 0.691 : 0) + (a.dm ? 0.874 : 0)]
};
module.exports = {
  id: 'pooled-cohort',
  eeId: 510,
  title: 'ASCVD risk (ACC/AHA Pooled Cohort Equations)',
  subtitle: '10-year risk of a first hard atherosclerotic cardiovascular event',
  question: 'For an adult aged 40 to 79 without cardiovascular disease, what is the 10-year risk of a heart attack, stroke or cardiovascular death?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 40, max: 79, step: 1, ee: 'AGE' },
    { id: 'tc', type: 'number', label: 'Total cholesterol', unit: 'mg/dL', min: 130, max: 320, step: 1, ee: 'CHOL' },
    { id: 'hdl', type: 'number', label: 'HDL cholesterol', unit: 'mg/dL', min: 20, max: 100, step: 1, ee: 'HDL' },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 90, max: 200, step: 1, ee: 'SBP' },
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'SEX', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'race', type: 'choice', label: 'Race', ee: 'RACE', options: [{ label: 'White or other' }, { label: 'African American' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'treated', type: 'check', label: 'Receiving treatment for hypertension', ee: 'HYPER' },
    { id: 'smoker', type: 'check', label: 'Current smoker', ee: 'SMOKER' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'DIABETES' }
  ],
  footnote: 'The equations were developed for ages 40 to 79, total cholesterol 130 to 320 mg/dL, HDL 20 to 100 mg/dL and systolic BP 90 to 200 mm Hg.',
  compute(a) {
    const [s0, mean, f] = MODELS[(a.race === 1 ? 'black' : 'white') + (a.sex === 0 ? 'Male' : 'Female')];
    const p = 100 * (1 - Math.pow(s0, Math.exp(f(a, L(Math.trunc(a.age)), L(Math.trunc(a.tc)), L(Math.trunc(a.hdl)), L(Math.trunc(a.sbp))) - mean)));
    return { level: p < 5 ? 1 : p < 7.5 ? 2 : p < 20 ? 3 : 4, headline: `10-year ASCVD risk: ${p.toFixed(1)}%` };
  }
};
