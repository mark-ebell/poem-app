// Intracranial hemorrhage with thrombolysis for acute MI (Brass; EE+ 189).
const RISK = ['0.69%', '0.69%', '1.02%', '1.63%', '2.49%', '4.11%'];
const ITEMS = [['age', 'Age 75 or older'], ['stroke', 'History of stroke'], ['sbp', 'Systolic BP 160 mm Hg or higher'],
  ['weight', 'Weight below 65 kg (143 lb) for women or below 80 kg (176 lb) for men'], ['tpa', 'tPA used (rather than another thrombolytic)'],
  ['inr', 'INR above 4 or PT above 24 seconds'], ['black', 'Black or African American'], ['female', 'Female']];

module.exports = {
  id: 'thrombolysis-ich',
  eeId: 189,
  title: 'Intracranial hemorrhage with thrombolysis for MI',
  subtitle: 'Risk of hemorrhagic stroke with thrombolytic therapy (Brass)',
  question: 'For an older patient receiving thrombolysis for acute MI, what is the risk of intracranial hemorrhage?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label], k) => ({ id, type: 'check', label, points: 1, ee: `IDC_CHECKBOX_${k + 1}` }))],
  points: { label: 'Risk factors', max: 8 },
  compute(a) {
    const s = ITEMS.filter(([id]) => a[id]).length;
    return { level: s <= 1 ? 1 : s <= 3 ? 2 : s === 4 ? 3 : 4, headline: `Risk of hemorrhagic stroke: ${RISK[Math.min(s, 5)]}` };
  }
};
