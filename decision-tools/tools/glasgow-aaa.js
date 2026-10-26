// Glasgow Aneurysm Score for ruptured AAA repair (validation: Leo 2006; EE+ 346).
module.exports = {
  id: 'glasgow-aaa',
  eeId: 346,
  title: 'Glasgow Aneurysm Score (ruptured AAA)',
  subtitle: 'Mortality after emergency open repair of a ruptured abdominal aortic aneurysm',
  question: 'For a patient having emergency open repair of a ruptured abdominal aortic aneurysm, what is the risk of death after surgery?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 10, max: 110, step: 1, ee: 'age' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'shock', type: 'check', label: 'Shock (tachycardia, hypotension, sweating)', ee: 'chk1' },
    { id: 'cardiac', type: 'check', label: 'History of angina or MI', ee: 'chk2' },
    { id: 'cva', type: 'check', label: 'History of stroke or TIA', ee: 'chk3' },
    { id: 'renal', type: 'check', label: 'Acute or chronic renal failure, or creatinine above 150 µmol/L (1.7 mg/dL)', ee: 'chk4' }
  ],
  compute(a) {
    const s = Math.trunc(a.age) + 17 * a.shock + 7 * a.cardiac + 10 * a.cva + 14 * a.renal;
    const out = s < 73.2 ? [1, 'Low risk', '10.8%'] : s < 88.9 ? [2, 'Moderate risk', '30.8%'] : [4, 'High risk', '92.1%'];
    return { score: { value: s, label: 'Glasgow Aneurysm Score' }, level: out[0], headline: `${out[1]}: postoperative mortality ${out[2]}` };
  },
  evidence: { population: 'Consecutive patients undergoing open repair between 1996 and 2004 at an Italian hospital. Mean age 73 years, 90% male.' }
};
