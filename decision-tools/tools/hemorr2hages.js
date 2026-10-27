// HEMORR2HAGES bleeding score (Gage 2006; EE+ 471).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'hemorr2hages',
  eeId: 471,
  title: 'HEMORR2HAGES score',
  subtitle: 'Bleeding on anticoagulation in atrial fibrillation',
  question: 'For an adult on long-term anticoagulation, what is the risk of bleeding?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'rebleed', type: 'check', label: 'Previous bleeding', points: 2, ee: 'BLEEDING' },
    ...[['hepatic', 'Alcohol abuse', 'ALCOHOL'], ['cancer', 'Malignancy', 'MALIGNANCY'], ['age', 'Age over 75', 'AGE'], ['platelets', 'Aspirin use or thrombocytopenia', 'ASPIRIN'],
      ['htn', 'Uncontrolled hypertension', 'HYPERTENSION'], ['anemia', 'Anemia', 'ANEMIA'], ['genetic', 'CYP2C9 single nucleotide polymorphism', 'CYP'],
      ['falls', "Excessive fall risk (including Parkinson's disease and dementia)", 'FALL'], ['stroke', 'Stroke', 'STROKE']].map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))
  ],
  points: { label: 'HEMORR2HAGES score', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 2 ? { level: 1, headline: 'Low risk: 2.1 bleeds per 100 patient-years (15 of 717)' } : s < 4 ? { level: 2, headline: 'Moderate risk: 5.0 bleeds per 100 patient-years (35 of 694)' } : { level: 4, headline: 'High risk: 8.8 bleeds per 100 patient-years (17 of 193)' };
  }
};
