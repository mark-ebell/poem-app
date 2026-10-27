// San Francisco Syncope Rule (Quinn 2004; EE+ 379).
module.exports = {
  id: 'sf-syncope',
  eeId: 379,
  title: 'San Francisco Syncope Rule',
  subtitle: 'Serious outcomes within 30 days of syncope',
  question: 'For an adult with syncope (not from alcohol, drugs, trauma or a definite seizure), what is the risk of a serious outcome within 30 days?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'sbp', type: 'check', label: 'Systolic BP under 90 mm Hg', ee: 'CHK_Systolic' },
    { id: 'sob', type: 'check', label: 'Shortness of breath', ee: 'CHK_Shortness' },
    { id: 'ecg', type: 'check', label: 'ECG: non-sinus rhythm or new changes', ee: 'CHK_ECG' },
    { id: 'chf', type: 'check', label: 'History of heart failure', ee: 'CHK_CHF' },
    { id: 'hct', type: 'check', label: 'Hematocrit under 30%', ee: 'CHK_Hematocrit' }
  ],
  footnote: 'Serious outcomes: death, MI, arrhythmia, PE, stroke, subarachnoid hemorrhage, significant hemorrhage, a procedure, or a return to the ED. A later prospective validation suggested age over 60 as another high-risk criterion (Ann Emerg Med 2007;49:420-7).',
  compute(a) {
    return a.sbp || a.sob || a.ecg || a.chf || a.hct ? { level: 3, headline: 'High risk: 15% had a serious outcome within 30 days' } : { level: 1, headline: 'Low risk: 0.3% had a serious outcome within 30 days' };
  }
};
