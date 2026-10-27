// Modified Early Warning Score: in-hospital mortality in older medical patients (EE+ 403).
const { pointsOf } = require('../lib');
const opt = (labels, pts) => labels.map((label, k) => ({ label, points: pts[k] }));

const tool = module.exports = {
  id: 'mews-elderly',
  eeId: 403,
  title: 'In-hospital mortality of older patients (MEWS)',
  subtitle: 'Modified Early Warning Score in older medical inpatients',
  question: 'For an older hospitalized medical patient, what is the risk of death in hospital?',
  inputs: [
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'CMB_BP', default: 3, options: opt(['70 or less', '71 to 80', '81 to 100', '101 to 199', '200 or more'], [3, 2, 1, 0, 2]) },
    { id: 'hr', type: 'choice', label: 'Heart rate', ee: 'CMB_HR', default: 2, options: opt(['40 or less', '41 to 50', '51 to 100', '101 to 110', '111 to 129', '130 or more'], [2, 1, 0, 1, 2, 3]) },
    { id: 'rr', type: 'choice', label: 'Respiratory rate', ee: 'CMB_RR', default: 1, options: opt(['Under 9', '9 to 14', '15 to 20', '21 to 29', '30 or more'], [2, 0, 1, 2, 3]) },
    { id: 'temp', type: 'choice', label: 'Temperature', ee: 'CMB_Temp', default: 1, options: opt(['Under 35°C', '35 to 38.4°C', '38.5°C or more'], [2, 0, 2]) },
    { id: 'avpu', type: 'choice', label: 'Level of alertness', ee: 'CMB_AVPU', options: opt(['Alert', 'Reacts to voice', 'Reacts to pain', 'Unresponsive'], [0, 1, 2, 3]) }
  ],
  points: { label: 'MEWS' },
  compute(a) {
    const s = pointsOf(tool, a);
    return { level: s <= 1 ? 1 : s <= 3 ? 2 : 4, headline: `In-hospital mortality: ${s < 5 ? [2.9, 7.9, 14.2, 22.5, 31.8][s] : 40}%` };
  }
};
