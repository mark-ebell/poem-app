// DECAF score, derivation (Steer 2012; EE+ 479). EE+ labeled the dyspnea question "Age".
const OUT = [['0.5', '1.5'], ['2.1', '3.8'], ['8.4', '12'], ['24', '27'], ['46', '46'], ['70', '70'], ['70', '70']];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'decaf',
  eeId: 479,
  title: 'COPD exacerbation prognosis (DECAF score)',
  subtitle: 'Mortality in hospitalized COPD exacerbations',
  question: 'For a patient hospitalized with a COPD exacerbation, what are the in-hospital and 30-day mortality?',
  inputs: [
    { id: 'dyspnea', type: 'choice', label: 'Dyspnea (extended MRC scale) when stable', ee: 'DYSPNEA', options: [{ label: 'Not too breathless to leave the house', points: 0 }, { label: 'Too breathless to leave the house, able to wash and/or dress', points: 1 }, { label: 'Too breathless to leave the house, unable to wash and dress', points: 2 }] },
    { id: 'eos', type: 'check', label: 'Eosinophil count under 0.05 × 10⁹/L', points: 1, ee: 'EOSINPHIL' },
    { id: 'consol', type: 'check', label: 'Consolidation (new) on chest x-ray', points: 1, ee: 'CONSOLIDATION' },
    { id: 'acid', type: 'check', label: 'Arterial blood gas pH under 7.3', points: 1, ee: 'ABGPH' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation on admission', points: 1, ee: 'AFIB' }
  ],
  points: { label: 'DECAF score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a), [h, d30] = OUT[s];
    return { level: s <= 1 ? 1 : s === 2 ? 2 : s === 3 ? 3 : 4, headline: `In-hospital mortality ${h}%, 30-day mortality ${d30}%` };
  }
};
