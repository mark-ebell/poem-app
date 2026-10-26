// Ottawa subarachnoid hemorrhage rule (validation: Perry 2017; EE+ 491). EE+ listed the rule without a calculator.
module.exports = {
  id: 'ottawa-sah',
  eeId: 491,
  title: 'Ottawa subarachnoid hemorrhage rule',
  subtitle: 'Who needs investigation for SAH with acute headache',
  question: 'For an alert adult in the ED with a new, non-traumatic headache peaking within an hour (or syncope with headache), does subarachnoid hemorrhage need to be ruled out?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'neck', type: 'check', label: 'Neck pain or stiffness (symptom)', ee: 'x1' },
    { id: 'age', type: 'check', label: 'Age 40 or older', ee: 'x2' },
    { id: 'loc', type: 'check', label: 'Witnessed loss of consciousness', ee: 'x3' },
    { id: 'exertion', type: 'check', label: 'Onset during exertion', ee: 'x4' },
    { id: 'thunderclap', type: 'check', label: 'Thunderclap headache (peak pain instantly)', ee: 'x5' },
    { id: 'flexion', type: 'check', label: 'Limited neck flexion on examination', ee: 'x6' }
  ],
  compute(a) {
    return a.neck || a.age || a.loc || a.exertion || a.thunderclap || a.flexion
      ? { level: 3, headline: 'Rule positive: investigate for subarachnoid hemorrhage', lines: ['With 1 or more findings, 67 of 938 had SAH.'] }
      : { level: 1, headline: 'Rule negative', lines: ['With none of these findings, 0 of 148 had SAH.'] };
  }
};
