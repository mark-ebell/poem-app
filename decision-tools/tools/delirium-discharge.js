// Delirium persisting at discharge in older inpatients (EE+ 429).
module.exports = {
  id: 'delirium-discharge',
  eeId: 429,
  title: 'Delirium at hospital discharge',
  subtitle: 'Delirium persisting at discharge in older inpatients',
  question: 'For a patient over 70 admitted without delirium, what is the risk of delirium at discharge?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dementia', type: 'check', label: 'Dementia by diagnosis, or modified Blessed Dementia Rating Scale 4 or more', ee: 'CHK_Dementia' },
    { id: 'vision', type: 'check', label: 'Vision impairment (worse than 20/70)', ee: 'CHK_Vision' },
    { id: 'adl', type: 'check', label: 'Impaired in more than one activity of daily living', ee: 'CHK_Impaired' },
    { id: 'charlson', type: 'check', label: 'Charlson score 4 or more', ee: 'CHK_Charlson' },
    { id: 'restraint', type: 'check', label: 'Restraint use during delirium', ee: 'CHK_Restraint' }
  ],
  compute(a) {
    const n = a.dementia + a.vision + a.adl + a.charlson + a.restraint;
    return n < 2 ? { level: 1, headline: 'Low risk: 108 of 594 (18%) had delirium at discharge' } : n < 4 ? { level: 3, headline: 'Intermediate risk: 114 of 236 (48%) had delirium at discharge' }
      : { level: 4, headline: 'High risk: 31 of 42 (74%) had delirium at discharge' };
  }
};
