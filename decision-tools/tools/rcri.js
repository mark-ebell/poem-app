// Revised Cardiac Risk Index (Lee 1999; EE+ 158).
const { pointsOf } = require('../lib');
const CLASSES = [[1, 'Risk class I (low)', '0.4%'], [2, 'Risk class II (moderate)', '0.9%'], [3, 'Risk class III (high)', '6.6%'], [4, 'Risk class IV (very high)', '11%']];

const tool = module.exports = {
  id: 'rcri',
  eeId: 158,
  title: 'Revised Cardiac Risk Index (Lee)',
  subtitle: 'Major cardiac complications of non-cardiac surgery',
  question: 'For a patient having major non-cardiac surgery, what is the risk of a major cardiac complication?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'surgery', type: 'check', label: 'High-risk surgery (intraperitoneal, intrathoracic, or suprainguinal vascular)', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'cad', type: 'check', label: 'Coronary artery disease', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'chf', type: 'check', label: 'Heart failure', points: 1, ee: 'IDC_CHECKBOX_3' },
    { id: 'cvd', type: 'check', label: 'History of cerebrovascular disease', points: 1, ee: 'IDC_CHECKBOX_4' },
    { id: 'insulin', type: 'check', label: 'Insulin treatment for diabetes', points: 1, ee: 'IDC_CHECKBOX_5' },
    { id: 'creat', type: 'check', label: 'Preoperative creatinine above 2.0 mg/dL (177 µmol/L)', points: 1, ee: 'IDC_CHECKBOX_6' }
  ],
  points: { label: 'Lee index', max: 6 },
  footnote: 'Major cardiac complications: MI, pulmonary edema, ventricular fibrillation or primary cardiac arrest, and complete heart block.',
  compute(a) {
    const [level, label, p] = CLASSES[Math.min(3, pointsOf(tool, a))];
    return { level, headline: label, lines: [`Risk of a major cardiac complication: ${p}`] };
  }
};
