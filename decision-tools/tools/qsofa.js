// qSOFA (Raith 2017; EE+ 568).
const RISK = ['10.0%', '14.5%', '19.5%', '33%'];

module.exports = {
  id: 'qsofa',
  eeId: 568,
  title: 'qSOFA score',
  subtitle: 'In-hospital mortality in suspected infection',
  question: 'For an adult with suspected infection, what is the qSOFA score and the in-hospital mortality?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mental', type: 'check', label: 'Altered mentation (Glasgow Coma Scale under 15)', ee: 'cb1' },
    { id: 'rr', type: 'check', label: 'Respiratory rate 22/min or more', ee: 'cb2' },
    { id: 'sbp', type: 'check', label: 'Systolic BP 100 mm Hg or less', ee: 'cb3' }
  ],
  footnote: 'qSOFA predicts mortality; it is not accurate for diagnosing sepsis.',
  compute(a) {
    const s = a.mental + a.rr + a.sbp;
    return { score: { value: s, max: 3, label: 'qSOFA score' }, headline: `In-hospital mortality: ${RISK[s]}` };
  },
  evidence: { reference: 'Raith EP, Udy AA, Bailey M, et al. Prognostic accuracy of the SOFA score, SIRS criteria, and qSOFA score for in-hospital mortality among adults with suspected infection admitted to the intensive care unit. JAMA. 2017;317(3):290-300.' }
};
