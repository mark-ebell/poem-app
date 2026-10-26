// Preserved left ventricular ejection fraction after acute MI (Silver; EE+ 26).
module.exports = {
  id: 'lvef-after-mi',
  eeId: 26,
  title: 'Normal LVEF after acute MI',
  subtitle: 'Likelihood of a preserved ejection fraction after myocardial infarction',
  question: 'After an acute MI, how likely is the left ventricular ejection fraction to be above 40%?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chf', type: 'check', label: 'History of CHF with the index MI', ee: 'CHF' },
    { id: 'ecg', type: 'check', label: 'ECG uninterpretable (LBBB, pacing, or LVH with strain)', ee: 'ECG' },
    { id: 'oldq', type: 'check', label: 'Old Q wave, or Q wave outside the region of ischemia', ee: 'OLD' },
    { id: 'anterior', type: 'check', label: 'Anterior MI with new Q waves or ST elevation', ee: 'MI' }
  ],
  compute(a) {
    return a.chf || a.ecg || a.oldq || a.anterior
      ? { level: 3, headline: 'High risk', lines: ['Only 57.3% have an LVEF above 40%.'] }
      : { level: 1, headline: 'Low risk', lines: ['98% have an LVEF above 40%.'] };
  }
};
