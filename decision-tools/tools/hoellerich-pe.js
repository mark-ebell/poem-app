// Pulmonary embolism diagnosis from clinical findings (Hoellerich and Wigton 1986; EE+ 36).
const ITEMS = [['young', 'Age under 65', 3], ['cancer', 'Diagnosis of cancer', 4], ['leg', 'Leg pain', 3], ['substernal', 'Substernal chest pain', -3],
  ['hr', 'Heart rate above 90 beats/min', 4], ['hrRise', 'Heart rate increase of more than 20 beats/min', 4], ['gallop', 'New S3 or S4', -4], ['scan', 'Positive lung scan', 5]];

module.exports = {
  id: 'hoellerich-pe',
  eeId: 36,
  title: 'Pulmonary embolism diagnosis (Hoellerich)',
  subtitle: 'Likelihood of PE from clinical findings and lung scan',
  question: 'For an adult with suspected pulmonary embolism, how likely is PE?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, points], k) => ({ id, type: 'check', label, points, ee: `IDC_CHECKBOX_${k + 1}` }))],
  footnote: 'The score starts at 8 points.',
  compute(a) {
    const s = 8 + ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    const r = s <= 10 ? [1, '0%'] : s <= 18 ? [2, '38%'] : s <= 23 ? [4, '89%'] : [4, '100%'];
    return { score: { value: s, label: 'Score' }, level: r[0], headline: `Likelihood of PE: ${r[1]}` };
  }
};
