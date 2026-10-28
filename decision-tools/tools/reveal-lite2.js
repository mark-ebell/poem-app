// REVEAL Lite 2 for pulmonary arterial hypertension (Benza 2021; EE+ 605).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'reveal-lite2',
  eeId: 605,
  title: 'Prognosis for patients with pulmonary arterial hypertension (REVEAL Lite 2.0 score)',
  subtitle: '1-year mortality in pulmonary arterial hypertension',
  question: 'For an adult with pulmonary arterial hypertension (pulmonary capillary wedge pressure 15 mm Hg or less), what is the 1-year mortality?',
  inputs: [
    { id: 'renal', type: 'check', label: 'Renal insufficiency (eGFR under 60 mL/min/1.73 m²)', points: 1, ee: 'cb1' },
    { id: 'fc', type: 'choice', label: 'NYHA or WHO functional class', ee: 'ddl1', options: [['Class I', -1], ['Class II', 0], ['Class III', 1], ['Class IV', 2]].map(([label, points]) => ({ label, points })) },
    { id: 'sbp', type: 'check', label: 'Systolic BP under 110 mm Hg', points: 1, ee: 'cb2' },
    { id: 'hr', type: 'check', label: 'Heart rate over 96 beats/min', points: 1, ee: 'cb3' },
    { id: 'walk', type: 'choice', label: '6-minute walk distance', ee: 'ddl2', options: [['440 m or more', -2], ['320 to 439 m', -1], ['165 to 319 m', 0], ['Under 165 m', 1]].map(([label, points]) => ({ label, points })) },
    { id: 'bnp', type: 'choice', label: 'BNP or NT-proBNP', ee: 'ddl3', options: [['BNP under 50 pg/mL or NT-proBNP under 300 pg/mL', -2], ['BNP 50 to 199 pg/mL or NT-proBNP 300 to 1099 pg/mL', 0], ['BNP 200 to 800 pg/mL', 1], ['BNP over 800 pg/mL or NT-proBNP 1100 pg/mL or more', 2]].map(([label, points]) => ({ label, points })) }
  ],
  compute(a) {
    const s = pointsOf(tool, a) + 6;
    return { score: { value: s, max: 14, label: 'REVEAL Lite 2 score' }, ...(s <= 5 ? { level: 1, headline: 'Low risk: 2.9% 1-year mortality' } : s <= 7 ? { level: 2, headline: 'Intermediate risk: 7.1% 1-year mortality' } : { level: 4, headline: 'High risk: 25.1% 1-year mortality' }) };
  }
};
