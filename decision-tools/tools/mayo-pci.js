// Complications of percutaneous coronary intervention: Mayo Clinic integer score (Singh; EE+ 221).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'mayo-pci',
  eeId: 221,
  title: 'Angioplasty complications (Mayo Clinic)',
  subtitle: 'Death, Q-wave MI, urgent CABG or stroke after PCI',
  question: 'For a patient having percutaneous coronary intervention, what is the risk of in-hospital death, Q-wave MI, urgent or emergency CABG, or stroke?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', default: 3, options: ['Under 40', '40 to 49', '50 to 59', '60 to 69', '70 to 79', '80 to 89', '90 to 99'].map((label, k) => ({ label, points: k })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'shock', type: 'check', label: 'Cardiogenic shock before the procedure', points: 5, ee: 'IDC_CHECKBOX_1' },
    { id: 'leftMain', type: 'check', label: 'Left main coronary disease', points: 5, ee: 'IDC_CHECKBOX_2' },
    { id: 'renal', type: 'check', label: 'Renal disease (serum creatinine above 3 mg/dL, 265 µmol/L)', points: 3, ee: 'IDC_CHECKBOX_3' },
    { id: 'urgent', type: 'check', label: 'Urgent or emergency procedure', points: 2, ee: 'IDC_CHECKBOX_4' },
    { id: 'multivessel', type: 'check', label: 'Multivessel disease', points: 2, ee: 'IDC_CHECKBOX_5' },
    { id: 'nyha', type: 'check', label: 'NYHA class III or higher (symptoms with minimal activity or at rest)', points: 2, ee: 'IDC_CHECKBOX_6' },
    { id: 'thrombus', type: 'check', label: 'Intracoronary thrombus', points: 2, ee: 'IDC_CHECKBOX_7' }
  ],
  points: { label: 'Mayo score', max: 27 },
  compute(a) {
    const s = pointsOf(tool, a);
    const r = s <= 5 ? [1, 'Very low risk', '1.0%'] : s <= 8 ? [1, 'Low risk', '3.0%'] : s <= 11 ? [2, 'Moderate risk', '6.2%'] : s <= 14 ? [3, 'High risk', '19.5%'] : [4, 'Very high risk', '35%'];
    return { level: r[0], headline: r[1], lines: [{ label: 'Complications', value: r[2] }] };
  }
};
