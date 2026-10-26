// Pretest probability of coronary artery disease (Genders, used by the ESC guideline; EE+ 585).
const { logistic } = require('../lib');

module.exports = {
  id: 'esc-pretest',
  eeId: 585,
  title: 'Pretest probability of CAD (ESC / Genders)',
  subtitle: 'Updated Diamond-Forrester model for stable chest pain',
  question: 'For an adult with chest pain suggestive of stable angina (not ACS, prior MI or revascularization), how likely is coronary artery disease?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'num1' },
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'cb1', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'pain', type: 'choice', label: 'Type of chest pain', ee: 'ddl1',
      note: 'Typical: (1) substernal pain or discomfort, (2) provoked by exertion or stress, and (3) relieved by rest or nitroglycerin. Atypical: 2 of these. Non-specific: 0 or 1 of these.',
      options: [{ label: 'Typical' }, { label: 'Atypical' }, { label: 'Non-specific' }] }
  ],
  compute(a) {
    const x = -4.37 + (a.sex === 0 ? 1.34 : 0) + 0.0426 * a.age + [1.91, 0.64, 0][a.pain];
    return { headline: `Probability of CAD: ${logistic(x).toFixed(1)}%` };
  }
};
