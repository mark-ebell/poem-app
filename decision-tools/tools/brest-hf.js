// Brest score: heart failure in ED dyspnea (Basset 2016; EE+ 556).
const ITEMS = [['age', 'Age over 65', 1], ['sudden', 'Sudden onset of dyspnea', 2], ['night', 'Onset of dyspnea at night', 1], ['orthopnea', 'Orthopnea', 1], ['priorHf', 'Prior episode of heart failure', 2],
  ['lung', 'Chronic pulmonary disease', -2], ['mi', 'History of acute myocardial infarction', 1], ['crackles', 'Pulmonary crackles', 2], ['edema', 'Pitting leg edema', 1],
  ['st', 'ST-segment abnormalities', 1], ['af', 'Atrial fibrillation or flutter', 1]];
module.exports = {
  id: 'brest-hf',
  eeId: 556,
  title: 'Brest score for heart failure',
  subtitle: 'Heart failure diagnosis in ED patients with acute dyspnea',
  question: 'For an adult in the ED with acute dyspnea, how likely is heart failure?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, points], k) => ({ id, type: 'check', label, points, ee: `cb${k + 1}` }))],
  points: { label: 'Brest score', max: 15 },
  footnote: 'The score starts at 2 points.',
  compute(a) {
    const s = 2 + ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    const r = s <= 3 ? [1, 'Low risk', '6.7%'] : s <= 8 ? [2, 'Intermediate risk', '59%'] : [4, 'High risk', '92%'];
    return { score: { value: s, max: 15, label: 'Brest score' }, level: r[0], headline: `${r[1]} for heart failure (${r[2]})` };
  }
};
