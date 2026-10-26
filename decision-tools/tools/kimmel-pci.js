// Complications of coronary angioplasty (Kimmel; EE+ 19).
const R = [['1.3%', 2054, '0.56', 1], ['2.5%', 2970, '1.13', 2], ['2.5%', 2970, '1.13', 2], ['5.4%', 184, '2.5', 3], ['16.7%', 42, '8.7', 4]];
const ITEMS = [['aortic', 'Aortic valve disease (regurgitation or stenosis)', 'AORTIC'],
  ['shock', 'Shock (unsupported systolic BP below 80 mm Hg with heart rate above 95 and signs of vascular collapse; or on a ventilator, intra-aortic balloon pump or high-dose vasopressors; or receiving CPR)', 'SHOCK'],
  ['leftMain', 'Left main coronary angioplasty', 'LEFT'], ['ami', 'Acute MI within 24 hours before angioplasty', 'AMI'], ['typeC', 'Type C lesion angioplasty', 'TYPE'],
  ['multivessel', 'Multivessel disease (2 or more lesions in 2 or more coronary distributions, each with 70% or more stenosis)', 'DISEASE'],
  ['unstable', 'Unstable angina (crescendo angina despite medical therapy, postinfarction angina, or admitting diagnosis of unstable angina)', 'ANGINA']];

module.exports = {
  id: 'kimmel-pci',
  eeId: 19,
  title: 'Angioplasty complications (Kimmel)',
  subtitle: 'Emergency CABG, MI or death after coronary angioplasty',
  question: 'For a patient having coronary angioplasty, what is the risk of emergency CABG, MI or death?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))],
  points: { label: 'Risk factors', max: 7 },
  compute(a) {
    const r = R[Math.min(ITEMS.filter(([id]) => a[id]).length, 4)];
    return { level: r[3], headline: `Emergency CABG, MI or death: ${r[0]}`, lines: [`Likelihood ratio ${r[2]} (${r[1]} patients in this group).`] };
  }
};
