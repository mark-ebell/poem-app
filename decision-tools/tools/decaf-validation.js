// DECAF score, validation cohort (Echevarria 2016; EE+ 539).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'decaf-validation',
  eeId: 539,
  title: 'COPD mortality risk in hospital (DECAF score)',
  subtitle: 'In-hospital mortality in acute exacerbations of COPD (validation cohort)',
  question: 'For a patient hospitalized with an acute exacerbation of COPD, what is the risk of death in hospital?',
  inputs: [
    { id: 'dyspnea', type: 'choice', label: 'In the past 3 months, when feeling at their best, which best describes the level of breathlessness?', ee: 'Breathless', options: [
      ['Only breathless on strenuous exertion', 0], ['Breathless hurrying on the level or walking up a slight hill', 0], ['Walks slower than contemporaries, or stops after walking on the level for 15 minutes', 0],
      ['Stops for breath after 100 yards (meters), or after a few minutes on the level', 0], ['Too breathless to leave the house unassisted, but independent in washing and/or dressing', 1], ['Too breathless to leave the house unassisted and needs help with washing and dressing', 2]].map(([label, points]) => ({ label, points })) },
    { id: 'eos', type: 'check', label: 'Eosinopenia (eosinophils < 0.05 × 10⁹/L)', points: 1, ee: 'Eosinopenia' },
    { id: 'consol', type: 'check', label: 'Radiographic evidence of consolidation', points: 1, ee: 'Radiographic' },
    { id: 'acid', type: 'check', label: 'Moderate or severe acidemia (pH < 7.3)', points: 1, ee: 'Moderate' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation (including a history of paroxysmal atrial fibrillation)', points: 1, ee: 'Atrial' }
  ],
  points: { label: 'DECAF score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 1 ? { level: 1, headline: 'Low risk: inpatient mortality 8/774 (1.0%)' } : s === 2 ? { level: 2, headline: 'Moderate risk: inpatient mortality 27/498 (5.4%)' } : { level: 4, headline: 'High risk: inpatient mortality 97/453 (21.4%)' };
  }
};
