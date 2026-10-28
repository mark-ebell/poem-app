// 28-day mortality in acute lung injury (Cooke 2009; EE+ 559).
const M = ['6', '10', '25', '42', '53', '53'];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'ards-cooke',
  eeId: 559,
  title: 'Mortality risk in acute lung injury (ARDS)',
  subtitle: '28-day mortality in acute lung injury or ARDS',
  question: 'For a patient hospitalized with acute lung injury or ARDS, what is the 28-day mortality?',
  inputs: [
    { id: 'hct', type: 'check', label: 'Hematocrit under 26%', points: 1, ee: 'cb1' },
    { id: 'bili', type: 'check', label: 'Bilirubin 2 mg/dL (34 µmol/L) or more', points: 1, ee: 'cb2' },
    { id: 'fluid', type: 'check', label: 'Fluid balance more than 2.5 liters positive', points: 1, ee: 'cb3' },
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: ['Under 40', '40 to 64', '65 or older'].map((label, points) => ({ label: `${label} years`, points })) }
  ],
  points: { label: 'Points', max: 5 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { level: s <= 1 ? 1 : s === 2 ? 2 : s === 3 ? 3 : 4, headline: `${M[s]}% 28-day mortality in the validation cohort` };
  }
};
