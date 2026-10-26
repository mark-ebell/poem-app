// Framingham cardiovascular risk profiles (Anderson 1991; EE+ 33): 10-year risk of six outcomes,
// with the risk of an "ideal" patient of the same age, sex, diabetes and LVH status.
const L = Math.log;
const weibull = (x, scale) => 100 * (1 - Math.exp(-Math.exp((L(10) - x) / scale)));
const MODELS = {
  'Coronary heart disease': (f, d, s, v, age, sbp, tc, hdl) => { const x = 15.5305 + 28.4441 * f - 1.4792 * L(age) - 14.4588 * L(age) * f + 1.8515 * L(age) ** 2 * f - 0.9119 * L(sbp) - 0.2767 * s - 0.7181 * L(tc / hdl) - 0.1759 * d - 0.1999 * d * f - 0.5865 * v; return weibull(x, Math.exp(0.9145 - 0.2784 * x)); },
  'Myocardial infarction': (f, d, s, v, age, sbp, tc, hdl) => { const x = 11.4712 + 10.5109 * f - 0.7965 * L(age) - 5.4216 * L(age) * f + 0.7101 * L(age) ** 2 * f - 0.6623 * L(sbp) - 0.2675 * s - 0.4277 * L(tc / hdl) - 0.1534 * d - 0.1165 * d * f - 0.1588 * v * f; return weibull(x, Math.exp(3.4064 - 0.8584 * x)); },
  'CHD death': (f, d, s, v, age, sbp, tc, hdl) => { const x = 11.2889 + 0.2332 * f - 0.944 * L(age) - 0.588 * L(sbp) - 0.1367 * s - 0.3448 * L(tc / hdl) - 0.0474 * d - 0.2233 * d * f - 0.1237 * v; return weibull(x, Math.exp(2.9851 - 0.9142 * x)); },
  Stroke: (f, d, s, v, age, sbp, tc, hdl) => { const x = 26.5116 + 0.2019 * f - 2.3741 * L(age) - 2.4643 * L(sbp) - 0.3914 * s - 0.0229 * L(tc / hdl) - 0.3087 * d - 0.2627 * d * f - 0.2355 * v; return weibull(x, Math.exp(-0.4312)); },
  'Cardiovascular disease': (f, d, s, v, age, sbp, tc, hdl) => { const x = 18.8144 - 1.2146 * f - 1.8443 * L(age) + 0.3668 * L(age) * f - 1.4032 * L(sbp) - 0.3899 * s - 0.539 * L(tc / hdl) - 0.3036 * d - 0.1697 * d * f - 0.3362 * v; return weibull(x, Math.exp(0.6536 - 0.2402 * x)); },
  'Cardiovascular death': (f, d, s, v, age, sbp, tc, hdl) => { const x = -5.0385 + 0.2243 * f + 8.237 * L(age) - 1.2109 * L(age) ** 2 - 0.8383 * L(sbp) - 0.1618 * s - 0.3493 * L(tc / hdl) - 0.0833 * d - 0.2067 * d * f - 0.2946 * v; return weibull(x, Math.exp(0.8207 - 0.4346 * x)); }
};

module.exports = {
  id: 'framingham-1991',
  eeId: 33,
  title: 'Framingham cardiovascular risk profiles (1991)',
  subtitle: '10-year risk of six cardiovascular outcomes',
  question: 'What is the 10-year risk of coronary heart disease, MI, stroke and cardiovascular death, compared with an "ideal" patient?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 30, max: 74, step: 1, ee: 'AGE' },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 80, max: 260, step: 1, ee: 'SBP' },
    { id: 'tc', type: 'number', label: 'Total cholesterol', unit: 'mg/dL', min: 80, max: 500, step: 1, ee: 'CHOLESTEROL' },
    { id: 'hdl', type: 'number', label: 'HDL cholesterol', unit: 'mg/dL', min: 10, max: 150, step: 1, ee: 'HDL' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'diabetes', type: 'check', label: 'Diabetes', ee: 'DIABETIC' },
    { id: 'smoker', type: 'check', label: 'Smoker', ee: 'SMOKER' },
    { id: 'lvh', type: 'check', label: 'Left ventricular hypertrophy on ECG', ee: 'LVH' }
  ],
  footnote: 'An "ideal" patient of the same age, sex, diabetes and LVH status has systolic BP 120 mm Hg, total cholesterol 160 mg/dL, HDL 45 mg/dL, and does not smoke.',
  compute(a) {
    const f = a.male ? 0 : 1, d = +a.diabetes, v = +a.lvh;
    const fmt = p => `${p.toFixed(1)}%`;
    const rows = Object.entries(MODELS).map(([name, m]) => [name, fmt(m(f, d, +a.smoker, v, a.age, a.sbp, a.tc, a.hdl)), fmt(m(f, d, 0, v, a.age, 120, 160, 45))]);
    return { headline: `10-year risk of coronary heart disease: ${rows[0][1]}`, table: { head: ['10-year risk of', 'This patient', 'Ideal'], rows } };
  }
};
