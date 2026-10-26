// Obesity surgery mortality risk score (validation: DeMaria 2007; EE+ 419).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'os-mrs',
  eeId: 419,
  title: 'Obesity surgery mortality risk score (OS-MRS)',
  subtitle: '90-day mortality after bariatric surgery',
  question: 'For a patient having bariatric surgery at an experienced center, what is the risk of death within 90 days?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bmi', type: 'check', label: 'Body mass index 50 kg/m² or more', points: 1, ee: 'CHK_BMI' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'CHK_Male' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1, ee: 'CHK_Hypertension' },
    { id: 'age', type: 'check', label: 'Age 45 or older', points: 1, ee: 'CHK_Age' },
    { id: 'vte', type: 'check', label: 'Risk factor for venous thromboembolism', points: 1, ee: 'CHK_VTE',
      note: 'Previous VTE, vena cava filter before surgery, hypoventilation, or pulmonary hypertension.' }
  ],
  points: { label: 'OS-MRS', max: 5 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 2 ? { level: 1, headline: 'Low risk: 90-day mortality 0.2% (5 of 2164)' }
      : s < 4 ? { level: 2, headline: 'Moderate risk: 90-day mortality 1.2% (25 of 2142)' }
      : { level: 4, headline: 'High risk: 90-day mortality 2.4% (3 of 125)' };
  }
};
