// Heart failure in primary care with NT-proBNP (Kelder 2011; EE+ 555).
const ITEMS = [['ischemic', 'History of MI, CABG or PCI', 15, 'cb1'], ['diuretic', 'Taking a loop diuretic', 10, 'cb2'], ['apex', 'Displaced apical impulse', 20, 'cb3'],
  ['rales', 'Rales (basal or more)', 14, 'cb4'], ['irregular', 'Irregularly irregular pulse', 11, 'cb5'], ['murmur', 'Heart murmur suggesting mitral regurgitation', 10, 'cb6'], ['jvp', 'Raised jugular venous pressure', 12, 'cb7']];
module.exports = {
  id: 'kelder-hf',
  eeId: 555,
  title: 'Heart failure in primary care (Kelder)',
  subtitle: 'Diagnosis of heart failure with NT-proBNP',
  question: 'For a primary care patient with signs and symptoms suggesting heart failure, how likely is heart failure?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl2', default: 1, options: [{ label: 'Under 60', points: 0 }, { label: '60 to 69', points: 4 }, { label: '70 to 79', points: 7 }, { label: '80 or older', points: 10 }] },
    { id: 'pulse', type: 'number', label: 'Pulse', unit: 'beats/min', min: 30, max: 200, step: 1, default: 80, ee: 'num1' },
    { id: 'bnp', type: 'choice', label: 'NT-proBNP (pg/mL)', ee: 'ddl1', options: ['Below 100', '100 to 199', '200 to 399', '400 to 799', '800 to 1599', '1600 to 3199', '3200 or higher'].map((label, k) => ({ label, points: 8 * k })) },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, points, ee]) => ({ id, type: 'check', label, points, ee }))
  ],
  footnote: 'Pulse adds 1 point for every 3 beats/min above 60.',
  compute(a) {
    const s = [0, 4, 7, 10][a.age] + ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0) + Math.trunc((a.pulse - 60) / 3) + 8 * a.bnp;
    const r = s < 13 ? [1, 'Very low risk', '11 of 233 (4.7%)'] : s <= 23 ? [1, 'Low risk', '27 of 170 (16%)'] : s <= 54 ? [2, 'Moderate risk', '85 of 222 (38%)']
      : s <= 63 ? [3, 'High risk', '21 of 27 (78%)'] : [4, 'Very high risk', '63 of 69 (91%)'];
    return { score: { value: s, label: 'Score' }, level: r[0], headline: r[1], lines: [`${r[2]} had heart failure.`] };
  }
};
