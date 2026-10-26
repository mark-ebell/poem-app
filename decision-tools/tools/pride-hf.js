// PRIDE acute heart failure score with NT-proBNP (Baggish; EE+ 330).
const ITEMS = [['ntprobnp', 'Elevated NT-proBNP (above 450 pg/mL if under 50 years, above 900 pg/mL if 50 or older)', 4, 'CHK_NT'], ['edema', 'Interstitial edema on chest x-ray', 2, 'CHK_CXR'],
  ['orthopnea', 'Orthopnea', 2, 'CHK_Orthopnea'], ['noFever', 'No fever', 2, 'CHK_NoFever'], ['diuretic', 'Current loop diuretic use', 1, 'CHK_Diuretic'], ['age', 'Age over 75', 1, 'CHK_Age'],
  ['rales', 'Rales on lung exam', 1, 'CHK_Rales'], ['noCough', 'No cough', 1, 'CHK_Cough']];
module.exports = {
  id: 'pride-hf',
  eeId: 330,
  title: 'PRIDE acute heart failure score',
  subtitle: 'Diagnosis of acute heart failure in ED dyspnea, with NT-proBNP',
  question: 'For a patient in the ED with dyspnea, how likely is acute heart failure?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, points, ee]) => ({ id, type: 'check', label, points, ee }))],
  points: { label: 'PRIDE score', max: 14 },
  compute(a) {
    const s = ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    const p = s < 3 ? '0%' : s < 6 ? '4%' : s < 8 ? '20%' : s < 10 ? '45%' : s < 12 ? '70%' : s < 14 ? '85%' : '100%';
    return { level: s < 6 ? 1 : s < 10 ? 2 : s < 12 ? 3 : 4, headline: `${p} had heart failure` };
  }
};
