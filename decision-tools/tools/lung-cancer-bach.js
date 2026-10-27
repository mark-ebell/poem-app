// 10-year lung cancer risk in smokers (Bach 2003; EE+ 210). Same year-by-year calculation as EE+, including its
// whole-number rounding of the patient counts.
const cube = x => x * x * x;
const caScore = (cpd, years, q, age, quit, fem, asb) => {
  let s = -9.7960571 + 0.060818386 * cpd + 0.11425297 * years - 0.085684793 * q + 0.070322812 * age + 0.2153936 * asb - 0.05827261 * fem;
  if (cpd > 15) s -= 0.00014652216 * cube(cpd - 15);
  if (cpd > 20) s += 0.00018486938 * cube(cpd - 20.185718);
  if (cpd > 40) s -= 0.000038347226 * cube(cpd - 40);
  if (years > 27) s -= 0.000080091477 * cube(years - 27.6577);
  if (years > 40) s += 0.00017069483 * cube(years - 40);
  if (years > 50) s -= 0.000090603358 * cube(years - 50.910335);
  if (quit) s += 0.0065499693 * cube(q);
  if (q > 0) s -= 0.0068305845 * cube(q - 0.50513347);
  if (q > 12) s += 0.00028061509 * cube(q - 12.295688);
  if (age > 53) s -= 0.00009382122 * cube(age - 53.459001);
  if (age > 61) s += 0.00018282661 * cube(age - 61.954825);
  if (age > 70) s -= 0.000089005389 * cube(age - 70.910335);
  return s;
};
const deathScore = (cpd, years, q, age, quit, fem, asb) => {
  let s = -7.2036219 + 0.015490665 * cpd + 0.020041889 * years - 0.023358962 * q + 0.099168033 * age + 0.06084611 * asb - 0.49042298 * fem;
  if (cpd > 15) s -= 0.00001737645 * cube(cpd - 15);
  if (cpd > 20) s += 0.000021924149 * cube(cpd - 20.185718);
  if (cpd > 40) s -= 0.0000045476985 * cube(cpd - 40);
  if (years > 27) s += 0.0000065443781 * cube(years - 27.6577);
  if (years > 40) s -= 0.000013947696 * cube(years - 40);
  if (years > 50) s += 0.0000074033175 * cube(years - 50.910335);
  if (quit) s += 0.0019208669 * cube(q);
  if (q > 0) s -= 0.0020031611 * cube(q - 0.50513347);
  if (q > 12) s += 0.000082294194 * cube(q - 12.295688);
  if (age > 53) s += 0.0000062174577 * cube(age - 53.459001);
  if (age > 61) s -= 0.000012115774 * cube(age - 61.954825);
  if (age > 70) s += 0.0000058983164 * cube(age - 70.910335);
  return s;
};

module.exports = {
  id: 'lung-cancer-bach',
  eeId: 210,
  title: 'Lung cancer risk in smokers (Bach)',
  subtitle: '10-year risk of lung cancer in current and former smokers',
  question: 'For a current or former smoker aged 55 to 85, what is the 10-year risk of lung cancer?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 55, max: 85, step: 1, ee: 'EDIT_Age' },
    { id: 'cpd', type: 'number', label: 'Cigarettes per day', min: 1, max: 100, step: 1, ee: 'EDIT_Cigs' },
    { id: 'years', type: 'number', label: 'Years of smoking', min: 1, max: 80, step: 1, ee: 'EDIT_Years' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'CHK_Female' },
    { id: 'asbestos', type: 'check', label: 'Asbestos exposure', ee: 'CHK_Asbestos' },
    { id: 'quit', type: 'check', label: 'Quit smoking', ee: 'CHK_Quit' },
    { id: 'quitYears', type: 'number', label: 'Years since quitting', min: 1, max: 60, step: 1, ee: 'EDIT_QuitYears', when: a => a.quit }
  ],
  footnote: 'The model was developed for ages 55 to 85.',
  compute(a) {
    let n = 100000, ca = 0, age = a.age, years = a.years, q = a.quit ? a.quitYears : 0;
    for (let i = 0; i < 10; i++) {
      const pCa = 1 - Math.pow(0.99629, Math.exp(caScore(a.cpd, years, q, age, a.quit, a.female, a.asbestos)));
      ca += Math.trunc(n * pCa);
      const pDeath = 1 - Math.pow(0.9917663, Math.exp(deathScore(a.cpd, years, q, age, a.quit, a.female, a.asbestos)));
      n = n - Math.trunc(n * pDeath) - Math.trunc(n * pCa);
      age += 1;
      if (a.quit) q += 1; else years += 1;
    }
    return { headline: `10-year lung cancer risk: ${(Math.round(ca / 100000 * 100 * 100) / 100).toFixed(2)}%` };
  }
};
