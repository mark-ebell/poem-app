// ATRIA bleeding risk score (Fang 2011; EE+ 469).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'atria-bleeding',
  eeId: 469,
  title: 'ATRIA bleeding score',
  subtitle: 'Warfarin-associated hemorrhage in atrial fibrillation',
  question: 'For a patient with nonvalvular atrial fibrillation on long-term warfarin, what is the risk of major bleeding?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'anemia', type: 'check', label: 'Anemia (hemoglobin below 13 g/dL in men or 12 g/dL in women)', points: 3, ee: 'ANEMIA' },
    { id: 'renal', type: 'check', label: 'Severe renal disease (GFR below 30 mL/min or dialysis)', points: 3, ee: 'RENAL' },
    { id: 'age', type: 'check', label: 'Age 75 or older', points: 2, ee: 'AGE' },
    { id: 'hemorrhage', type: 'check', label: 'Any prior hemorrhage', points: 1, ee: 'HEM' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1, ee: 'HYPERTENSION' }
  ],
  points: { label: 'ATRIA score', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 1, headline: 'Low risk: 0.76 major bleeds per 100 person-years' } : s < 5 ? { level: 2, headline: 'Moderate risk: 2.6 major bleeds per 100 person-years' } : { level: 4, headline: 'High risk: 5.8 major bleeds per 100 person-years' };
  }
};
