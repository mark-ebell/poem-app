// Mini-GRACE score: very low risk of acute MI without biomarkers (Tscherny; EE+ 610).
const { pointsOf } = require('../lib');
const opts = (labels, points) => labels.map((label, k) => ({ label, points: points[k] }));

const tool = module.exports = {
  id: 'mini-grace',
  eeId: 610,
  title: 'Mini-GRACE score',
  subtitle: 'Very low risk of acute MI from history, vital signs and ECG',
  question: 'For a patient in the ED with chest pain, new shortness of breath, reduced exercise tolerance or another angina equivalent, is the risk of acute MI very low?',
  inputs: [
    { id: 'killip', type: 'choice', label: 'Killip class', ee: 'ddl1', options: opts(['I: no signs of congestion', 'II: S3 and rales', 'III: acute pulmonary edema', 'IV: cardiogenic shock'], [0, 20, 39, 59]) },
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'ddl2', options: opts(['Below 80', '80 to 99', '100 to 119', '120 to 139', '140 to 159', '160 to 199', '200 or more'], [58, 53, 43, 34, 24, 10, 0]) },
    { id: 'hr', type: 'choice', label: 'Heart rate (beats/min)', ee: 'ddl3', options: opts(['Below 50', '50 to 69', '70 to 89', '90 to 109', '110 to 149', '150 to 199', '200 or more'], [0, 3, 9, 15, 24, 38, 46]) },
    { id: 'age', type: 'choice', label: 'Age (years)', ee: 'ddl4', options: opts(['Below 30', '30 to 39', '40 to 49', '50 to 59', '60 to 69', '70 to 79', '80 to 89', '90 or older'], [0, 8, 25, 41, 58, 75, 91, 100]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'arrest', type: 'check', label: 'Cardiac arrest at admission', points: 39, ee: 'cb1' },
    { id: 'st', type: 'check', label: 'ST-segment deviation on ECG', points: 28, ee: 'cb2' }
  ],
  points: { label: 'Mini-GRACE score', max: 330 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s >= 108
      ? { level: 4, headline: 'High risk for acute MI', lines: ['99 of 193 (51%) in the validation population had acute MI.'], note: 'High risk: 108 points or more.' }
      : { level: 1, headline: 'Low risk for acute MI', lines: ['4 of 2558 (0.16%) in the validation population had acute MI.'], note: 'High risk: 108 points or more.' };
  }
};
