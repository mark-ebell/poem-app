// Detsky modified cardiac risk index for non-cardiac surgery (Detsky 1986; EE+ 2).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'detsky',
  eeId: 2,
  title: 'Detsky modified cardiac risk index',
  subtitle: 'Cardiac complications of non-cardiac surgery',
  question: 'For a patient having non-cardiac surgery, what is the risk of perioperative MI, heart failure or cardiac death?',
  inputs: [
    { id: 'surgery', type: 'choice', label: 'Type of surgery', ee: 'SURGERY', options: [{ label: 'Major' }, { label: 'Minor' }] },
    { id: 'angina', type: 'choice', label: 'Angina class', ee: 'CLASS', options: [
      { label: 'No class III or IV angina', points: 0 }, { label: 'Class III: angina walking 1 to 2 blocks on the level or climbing 1 flight of stairs', points: 10 },
      { label: 'Class IV: angina with any physical activity', points: 20 }] },
    { id: 'mi', type: 'choice', label: 'History of MI', ee: 'HISTORY', options: [
      { label: 'None', points: 0 }, { label: 'Within 6 months', points: 10 }, { label: 'More than 6 months ago', points: 5 }] },
    { id: 'edema', type: 'choice', label: 'Alveolar pulmonary edema', ee: 'ALVEOLAR', options: [
      { label: 'Never', points: 0 }, { label: 'Within 1 week', points: 10 }, { label: 'Ever', points: 5 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'as', type: 'check', label: 'Suspected critical aortic stenosis', points: 20, ee: 'SUSPECTED' },
    { id: 'unstable', type: 'check', label: 'Unstable angina in the past 6 months', points: 10, ee: 'ANGINA' },
    { id: 'emergency', type: 'check', label: 'Emergency surgery', points: 10, ee: 'EMERGENCY' },
    { id: 'rhythm', type: 'check', label: 'Rhythm other than sinus, or sinus with premature atrial contractions', points: 5, ee: 'RHYTHM' },
    { id: 'pvc', type: 'check', label: 'More than 5 premature ventricular contractions on the ECG', points: 5, ee: 'PVC' },
    { id: 'age', type: 'check', label: 'Age over 70', points: 5, ee: 'AGE' },
    { type: 'heading', label: 'Poor general medical status (5 points if any)' },
    { id: 'bun', type: 'check', label: 'BUN above 50 mg/dL (18 mmol/L) or creatinine above 3 mg/dL (264 µmol/L)', ee: 'BUN' },
    { id: 'gas', type: 'check', label: 'pO2 below 60 or pCO2 above 50 mm Hg, or HCO3 below 20 mEq/L', ee: 'PO2' },
    { id: 'k', type: 'check', label: 'K below 3 mmol/L, or bedridden from non-cardiac causes', ee: 'K' },
    { id: 'liver', type: 'check', label: 'Abnormal AST or signs of chronic liver disease', ee: 'SGOT' }
  ],
  points: { label: 'Detsky score' },
  scoreOf: a => pointsOf(tool, a) + (a.bun || a.gas || a.k || a.liver ? 5 : 0),
  compute(a) {
    const s = tool.scoreOf(a), minor = a.surgery === 1;
    const [level, label, p] = s <= 15 ? [1, 'Low risk (class I)', minor ? ['0.4%', '1%', '1.2%', '3%'] : ['2.2%', '5%', '4.5%', '10%']]
      : s <= 30 ? [2, 'Moderate risk (class II)', minor ? ['2.7%', '1%', '7.8%', '3%'] : ['15.9%', '5%', '28.5%', '10%']]
      : [4, 'High risk (class III)', minor ? ['11.0%', '1%', '27.4%', '3%'] : ['44.0%', '5%', '62.3%', '10%']];
    return {
      score: { value: s, label: 'Detsky score' },
      level,
      headline: label,
      lines: [`Perioperative risk of MI, heart failure or death: ${p[0]} given a baseline risk of ${p[1]}; ${p[2]} given a baseline risk of ${p[3]}.`]
    };
  }
};
