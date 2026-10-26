// In-hospital mortality after percutaneous coronary intervention (Resnic; EE+ 194).
const ITEMS = [['shock', 'Cardiogenic shock', 4], ['age', 'Age 75 or older', 2], ['tachy', 'Tachycardia', 2], ['renal', 'Chronic renal insufficiency', 2],
  ['leftMain', 'Left main intervention', 3], ['lesion', 'Type B2 or C lesion', 1], ['nyha', 'NYHA class III or IV heart failure (symptoms with minimal activity or at rest)', 4],
  ['ami', 'Acute MI', 1], ['stent', 'Stent used', -1], ['unstable', 'Unstable angina', 1]];

module.exports = {
  id: 'resnic-pci',
  eeId: 194,
  title: 'Angioplasty mortality (Resnic)',
  subtitle: 'In-hospital death after percutaneous coronary intervention',
  question: 'For a patient having percutaneous coronary intervention, what is the risk of in-hospital death?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, points], k) => ({ id, type: 'check', label, points, ee: `IDC_CHECKBOX_${k + 1}` }))],
  footnote: 'The score starts at 1 point.',
  compute(a) {
    const s = 1 + ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    const r = s < 3 ? [1, 'Low risk', '0.4%'] : s < 5 ? [2, 'Moderate risk', '2.2%'] : [4, 'High risk', '16.1%'];
    return { score: { value: s, label: 'Score' }, level: r[0], headline: r[1], lines: [{ label: 'In-hospital mortality', value: r[2] }] };
  }
};
