// CHADS2 with stroke rates in patients taking aspirin (EE+ 363).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'chads2',
  eeId: 363,
  title: 'CHADS2 (atrial fibrillation on aspirin)',
  subtitle: 'Annual stroke risk in atrial fibrillation, by risk group',
  question: 'For a patient with atrial fibrillation taking aspirin, what is the yearly risk of stroke?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chf', type: 'check', label: 'Heart failure', points: 1, ee: 'CHK_CHF' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1, ee: 'CHK_Hypertension' },
    { id: 'age', type: 'check', label: 'Age 75 or older', points: 1, ee: 'CHK_Age' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 1, ee: 'CHK_Diabetes' },
    { id: 'stroke', type: 'check', label: 'History of stroke or TIA', points: 2, ee: 'CHK_Stroke' }
  ],
  points: { label: 'CHADS2 score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 1 ? { level: 1, headline: 'Low risk: 0.8% (95% CI 0.4 to 1.7) annual stroke risk' }
      : s < 3 ? { level: 2, headline: 'Moderate risk: 2.7% (95% CI 2.2 to 3.4) annual stroke risk' }
      : { level: 4, headline: 'High risk: 5.3% (95% CI 3.3 to 8.4) annual stroke risk' };
  }
};
