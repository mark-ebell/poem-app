// Major adverse outcomes after coronary angioplasty (Fortescue, Kahn, Bates; EE+ 199).
const { pointsOf } = require('../lib');
const ITEMS = [['emergent', 'Emergent priority', 5], ['shock', 'Cardiogenic shock', 7], ['lvef', 'Left ventricular ejection fraction below 30%', 3],
  ['backup', 'No surgical backup for the procedure', 2], ['leftMain', 'Left main coronary stenosis above 70%', 3], ['surgery', 'Prior non-coronary bypass cardiac surgery', 3],
  ['hct', 'Last hematocrit before the procedure 35% or less', 3], ['stroke', 'History of stroke or TIA', 2], ['lvedp', 'Left ventricular end-diastolic pressure 25 mm Hg or less', 2], ['mi', 'History of MI', 1]];
const R = [[0, '0.6%', '0.1%', 1], [2, '1.2%', '0.3%', 1], [4, '1.7%', '0.9%', 2], [6, '4.7%', '1.8%', 2], [8, '5.6%', '3.1%', 3], [Infinity, '21.8%', '12.7%', 4]];

const tool = module.exports = {
  id: 'bates-pci',
  eeId: 199,
  title: 'Angioplasty complications (Bates)',
  subtitle: 'Major adverse outcomes after coronary angioplasty',
  question: 'For a patient having coronary angioplasty, what is the risk of a major adverse outcome or in-hospital death?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 70', points: 0 }, { label: '70 to 79', points: 1 }, { label: '80 or older', points: 3 }] },
    { id: 'creat', type: 'choice', label: 'Last serum creatinine before the procedure (mg/dL)', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Below 1.5', points: 0 }, { label: '1.5 to 3.0', points: 2 }, { label: 'Above 3.0', points: 4 }] },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, points], k) => ({ id, type: 'check', label, points, ee: `IDC_CHECKBOX_${k + 1}` }))
  ],
  points: { label: 'Score', max: 41 },
  footnote: 'Major adverse outcomes: death, renal failure, myocardial infarction, cardiac arrest, stroke or coma.',
  compute(a) {
    const r = R.find(([max]) => pointsOf(tool, a) <= max);
    return { level: r[3], lines: [{ label: 'Major adverse outcome', value: r[1] }, { label: 'In-hospital death', value: r[2] }] };
  }
};
