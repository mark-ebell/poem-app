// Modified CHADS2 score: stroke in chronic atrial fibrillation (Rietbrock; EE+ 613).
const RISK = ['0.72', '1.1', '1.4', '1.7', '2.1', '2.6', '3.7', '4.7', '6.1', '7.3', '8.4', '10.0', '12.3', '15.9', '15.6'];
module.exports = {
  id: 'modified-chads2',
  eeId: 613,
  title: 'Modified CHADS2 score',
  subtitle: 'Stroke risk in chronic atrial fibrillation',
  question: 'For a patient with chronic atrial fibrillation, what is the risk of stroke?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: ['Under 40', '40 to 64', '65 to 69', '70 to 74', '75 to 79', '80 to 84', '85 or older'].map((label, k) => ({ label, points: k })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female sex', points: 1, ee: 'cb1' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', points: 1, ee: 'cb2' },
    { id: 'stroke', type: 'check', label: 'History of stroke or TIA', points: 6, ee: 'cb3' }
  ],
  points: { label: 'Modified CHADS2', max: 14 },
  compute(a) {
    const s = a.age + a.female + a.dm + 6 * a.stroke;
    return { level: s <= 2 ? 1 : s <= 5 ? 2 : s <= 9 ? 3 : 4, headline: `Risk of stroke: ${RISK[s]} per 100 person-years` };
  }
};
