// Colorectal cancer in symptomatic patients, FIT-based model (Cubiella 2016; EE+ 558).
module.exports = {
  id: 'cubiella-fit',
  eeId: 558,
  title: 'Colorectal cancer risk with FIT (Cubiella)',
  subtitle: 'Colorectal cancer and advanced neoplasia in symptomatic patients',
  question: 'For a symptomatic adult referred for colonoscopy, what is the risk of colorectal cancer?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'num1' },
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'ddl1', default: 2, options: [{ label: 'Under 10 g/dL' }, { label: '10 to 12 g/dL' }, { label: 'Over 12 g/dL' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fit', type: 'check', label: 'Fecal immunochemical test 20 µg/g of feces or more', ee: 'cb5' },
    { id: 'mass', type: 'check', label: 'Rectal mass', ee: 'cb3' },
    { id: 'cea', type: 'check', label: 'CEA 3.0 ng/mL or more', ee: 'cb6' },
    { id: 'male', type: 'check', label: 'Male', ee: 'cb8' },
    { id: 'bleeding', type: 'check', label: 'Rectal bleeding', ee: 'cb1' },
    { id: 'habits', type: 'check', label: 'Change in bowel habits', ee: 'cb2' },
    { id: 'benign', type: 'check', label: 'Benign anorectal lesions', ee: 'cb4' },
    { id: 'aspirin', type: 'check', label: 'Continuous aspirin treatment', ee: 'cb9' },
    { id: 'colonoscopy', type: 'check', label: 'Colonoscopy in the past 10 years', ee: 'cb7' }
  ],
  compute(a) {
    const s = 0.789 * a.bleeding + 0.536 * a.habits + 2.694 * a.mass - 1.283 * a.benign + 2.831 * a.fit + 1.511 * a.cea - 2.073 * a.colonoscopy
      + 0.813 * a.male - 0.849 * a.aspirin + 0.04 * a.age + [0, 1.561, 0.588][a.hb];
    const v = Number(s.toFixed(2));
    const r = v < 3.5 ? [1, 'Low risk', '0.2%', '7.1%'] : v < 5.6 ? [2, 'Intermediate risk', '4.4%', '21%'] : [4, 'High risk', '41%', '58%'];
    return { score: { value: v, label: 'Score' }, level: r[0], headline: `${r[1]}: ${r[2]} colorectal cancer`, lines: [`Advanced neoplasia: ${r[3]}`] };
  }
};
