// Cesarean risk when attempting VBAC at 40 to 42 weeks (Smith 2005; EE+ 361).
const HEIGHT_OR = [2.68, 2.54, 2.4, 2.27, 2.15, 2.04, 1.93, 1.82, 1.72, 1.63, 1.54, 1.46, 1.38, 1.31, 1.24, 1.17, 1.11, 1.05, 0.99, 0.94,
  0.89, 0.84, 0.8, 0.75, 0.71, 0.67, 0.64, 0.6, 0.57, 0.54, 0.51, 0.48, 0.46, 0.43, 0.41, 0.39, 0.37, 0.35, 0.33, 0.31]; // 143 to 182 cm
const AGE_OR = [0.62, 0.65, 0.68, 0.71, 0.74, 0.77, 0.81, 0.84, 0.88, 0.92, 0.96, 1, 1.04, 1.09, 1.13, 1.18, 1.23, 1.29, 1.34, 1.4,
  1.46, 1.53, 1.59, 1.66, 1.74, 1.81]; // 18 to 43 years

module.exports = {
  id: 'vbac-smith',
  eeId: 361,
  title: 'Cesarean risk with VBAC at 40 to 42 weeks (Smith)',
  subtitle: 'Emergency cesarean among women attempting vaginal birth after cesarean',
  question: 'For a woman at 40 weeks or more with one previous cesarean who attempts a vaginal birth, what is the risk of cesarean delivery?',
  inputs: [
    { id: 'height', type: 'choice', label: 'Height', ee: 'CMB_Height', options: HEIGHT_OR.map((_, k) => ({ label: `${143 + k} cm (${((143 + k) / 2.54).toFixed(1)} in)` })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: AGE_OR.map((_, k) => ({ label: `${18 + k}` })) },
    { id: 'gestation', type: 'choice', label: 'Gestation', ee: 'CMB_Gestation', options: [{ label: '40 weeks' }, { label: '41 weeks' }, { label: '42 weeks' }] },
    { id: 'induction', type: 'choice', label: 'Induction', ee: 'CMB_Induction', options: [{ label: 'None' }, { label: 'Without prostaglandin' }, { label: 'With prostaglandin' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'vaginal', type: 'check', label: 'Previous vaginal birth', ee: 'CHK_VaginalBirth' },
    { id: 'male', type: 'check', label: 'Male infant', ee: 'CHK_Sex' }
  ],
  footnote: 'Women at higher risk of cesarean were also at higher risk of uterine rupture.',
  compute(a) {
    const odds = 0.35 * HEIGHT_OR[a.height] * AGE_OR[a.age] * (a.vaginal ? 0.3 : 1.51) * (a.male ? 1.1 : 0.91) * [0.88, 1.13, 1.26][a.gestation] * [0.93, 0.99, 1.37][a.induction];
    return { headline: `Probability of cesarean: ${Math.round(100 * odds / (1 + odds))}%`, lines: ['Baseline risk of cesarean: 26%.'] };
  },
  evidence: { reference: 'Smith GCS, White IR, Pell JP, Dobbie R. Predicting cesarean section and uterine rupture among women attempting vaginal birth after prior cesarean section. PLoS Med. 2005;2(9):e252.' }
};
