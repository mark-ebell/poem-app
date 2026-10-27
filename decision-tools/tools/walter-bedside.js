// Bedside risk score: 1-year mortality after discharge for patients 70 and older (Walter 2001; EE+ 583).
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'walter-bedside',
  eeId: 583,
  title: 'Mortality after hospital discharge in older adults (bedside risk score)',
  subtitle: '1-year mortality after a general medicine admission at 70 or older',
  question: 'For a patient 70 or older admitted to general medicine for at least 2 days (not ICU, elective or specialty), what is the risk of death within 1 year of discharge?',
  inputs: [
    { id: 'adl', type: 'choice', label: 'Dependence in activities of daily living', ee: 'ddl1', options: opts([['Independent', 0], ['Dependent in 1 to 4', 2], ['Dependent in all 5', 5]]),
      note: 'Bathing, dressing, using the toilet, transferring from bed to chair, and eating.' },
    { id: 'cancer', type: 'choice', label: 'Cancer', ee: 'ddl2', options: opts([['None', 0], ['Non-metastatic', 3], ['Metastatic', 8]]) },
    { id: 'albumin', type: 'choice', label: 'Albumin', ee: 'ddl3', options: opts([['Over 3.4 g/dL', 0], ['3.0 to 3.4', 1], ['Under 3.0', 2]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'cb1' },
    { id: 'chf', type: 'check', label: 'Heart failure', points: 2, ee: 'cb2' },
    { id: 'creat', type: 'check', label: 'Creatinine over 3.0 mg/dL (265 µmol/L)', points: 2, ee: 'cb3' }
  ],
  points: { label: 'Score', max: 20 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 1 ? { level: 1, headline: 'Low risk: 4% 1-year mortality (95% CI 2% to 6%)' } : s <= 3 ? { level: 2, headline: 'Moderate risk: 19% 1-year mortality (95% CI 15% to 23%)' }
      : s <= 6 ? { level: 3, headline: 'High risk: 34% 1-year mortality (95% CI 29% to 39%)' } : { level: 4, headline: 'Very high risk: 64% 1-year mortality (95% CI 58% to 70%)' };
  }
};
