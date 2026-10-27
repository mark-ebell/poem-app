// Major bleeding in older adults on warfarin for atrial fibrillation (Shireman 2006; EE+ 380).
const ITEMS = [['anemia', 'Anemia', 'CHK_Anemia', 0.86], ['alcohol', 'Alcohol or drug abuse', 'CHK_Alcohol', 0.71], ['recent', 'Recent bleeding (ongoing or during this hospitalization)', 'CHK_Recent', 0.62],
  ['prior', 'Previous bleeding event', 'CHK_History', 0.58], ['age', 'Age 70 or older', 'CHK_Age', 0.49], ['female', 'Female', 'CHK_Female', 0.32],
  ['antiplatelet', 'Antiplatelet drug use', 'CHK_Antiplatelet', 0.32], ['dm', 'Diabetes', 'CHK_Diabetes', 0.27]];

module.exports = {
  id: 'shireman-bleeding',
  eeId: 380,
  title: 'Bleeding in older adults on warfarin (Shireman)',
  subtitle: 'Major bleeding within 90 days of discharge on warfarin for atrial fibrillation',
  question: 'For a patient 65 or older discharged on warfarin for atrial fibrillation, what is the risk of major bleeding in 90 days?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))],
  compute(a) {
    const s = ITEMS.reduce((t, [id, , , w]) => t + (a[id] ? w : 0), 0);
    const v = Number(s.toFixed(2));
    return v <= 1.07 ? { score: { value: v, label: 'Score' }, level: 1, headline: 'Low risk: 35 of 3889 (0.9%) had major bleeding within 90 days' }
      : v <= 2.19 ? { score: { value: v, label: 'Score' }, level: 2, headline: 'Moderate risk: 48 of 2400 (2.0%) had major bleeding within 90 days' }
      : { score: { value: v, label: 'Score' }, level: 4, headline: 'High risk: 12 of 222 (5.4%) had major bleeding within 90 days' };
  }
};
