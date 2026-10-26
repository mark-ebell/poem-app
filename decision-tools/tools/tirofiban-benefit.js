// Benefit of tirofiban in unstable angina / non-Q-wave MI (Sabatine; EE+ 162).
const ITEMS = [['age', 'Age over 65'], ['aspirin', 'Prior aspirin use'], ['bb', 'Prior beta-blocker use'], ['cabg', 'Prior coronary artery bypass graft'], ['st', 'ST depression on the initial ECG']];

module.exports = {
  id: 'tirofiban-benefit',
  eeId: 162,
  title: 'Tirofiban benefit in unstable angina',
  subtitle: 'Adding a glycoprotein IIb/IIIa inhibitor to heparin (Sabatine)',
  question: 'Which patients with unstable angina will benefit from adding tirofiban to heparin?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label], k) => ({ id, type: 'check', label, points: 1, ee: `IDC_CHECKBOX_${k + 1}` }))],
  points: { label: 'Score', max: 5 },
  compute(a) {
    const s = ITEMS.filter(([id]) => a[id]).length;
    if (s <= 1) return { level: 1, headline: 'Low risk', lines: ['No significant benefit from adding tirofiban.'] };
    if (s <= 3) return { level: 2, headline: 'Moderate risk', lines: ['5% absolute risk reduction from adding tirofiban (NNT 20).'] };
    return { level: 3, headline: 'High risk', lines: ['16% absolute risk reduction from adding tirofiban (NNT 6.5).'] };
  }
};
