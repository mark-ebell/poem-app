// Erasmus GBS Respiratory Insufficiency Score (EGRIS; Walgaard 2010). Added beside EE+ 391 at Mark Ebell's
// request (2026-10-27). The paper gives the risk for each score only as a graph; the grouped risks here
// are the observed rates commonly cited from it.
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'egris',
  categories: ['Neurology'],
  title: 'Respiratory insufficiency in Guillain-Barré syndrome (EGRIS)',
  subtitle: 'Mechanical ventilation within the first week in Guillain-Barré syndrome',
  question: 'For a patient admitted with Guillain-Barré syndrome, what is the risk of needing mechanical ventilation in the first week?',
  inputs: [
    { id: 'days', type: 'choice', label: 'Days from onset of weakness to admission', options: opts([['More than 7 days', 0], ['4 to 7 days', 1], ['3 days or less', 2]]) },
    { id: 'mrc', type: 'choice', label: 'MRC sum score at admission', options: opts([['51 to 60', 0], ['41 to 50', 1], ['31 to 40', 2], ['21 to 30', 3], ['20 or less', 4]]),
      note: 'Strength (0 to 5) of shoulder abduction, elbow flexion, wrist extension, hip flexion, knee extension and ankle dorsiflexion on both sides; total 0 to 60.' },
    { id: 'bulbar', type: 'choice', label: 'Facial or bulbar weakness at admission', options: opts([['Absent', 0], ['Present', 1]]) }
  ],
  points: { label: 'EGRIS', max: 7 },
  footnote: 'Across scores 0 to 7, the predicted risk ranges from about 1% to 91%.',
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 2 ? { level: 1, headline: 'Low risk: 4% needed mechanical ventilation in the first week' }
      : s <= 4 ? { level: 3, headline: 'Intermediate risk: 24% needed mechanical ventilation in the first week' }
      : { level: 4, headline: 'High risk: 65% needed mechanical ventilation in the first week' };
  },
  evidence: {
    reference: 'Walgaard C, Lingsma HF, Ruts L, et al. Prediction of respiratory insufficiency in Guillain-Barré syndrome. Ann Neurol. 2010;67(6):781-787.',
    pmid: '20517939',
    population: 'Derived in 397 Dutch patients with Guillain-Barré syndrome (22% ventilated in the first week) and validated in a separate cohort of 191 (14%).',
    validation: 'External validation in the same paper (AUC 0.82); validated internationally in the IGOS cohort (Doets 2022, Ann Neurol 91:521-531).',
    prevalence: null, developed: 397, validated: 191,
    comment: 'Area under the ROC curve 0.84 in derivation and 0.82 in validation.'
  }
};
