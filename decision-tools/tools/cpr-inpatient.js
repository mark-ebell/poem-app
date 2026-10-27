// Survival to discharge after in-hospital CPR (EE+ 171).
module.exports = {
  id: 'cpr-inpatient',
  eeId: 171,
  title: 'In-hospital CPR: survival to discharge',
  subtitle: 'Survival to discharge after in-hospital cardiopulmonary resuscitation',
  question: 'For a patient having in-hospital CPR, what is the chance of surviving to discharge?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'witnessed', type: 'check', label: 'Witnessed (seen to lose circulation, or arrested on a monitor)', ee: 'IDC_CHECKBOX_1' },
    { id: 'vt', type: 'check', label: 'Initial rhythm ventricular tachycardia or fibrillation', ee: 'IDC_CHECKBOX_2' },
    { id: 'pulse', type: 'check', label: 'Pulse lasting 2 minutes or more within the first 10 minutes of compressions', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    return a.witnessed || a.vt || a.pulse ? { level: 3, headline: 'Chance of survival to discharge: 18%' } : { level: 4, headline: 'Chance of survival to discharge very low (about 1%)' };
  }
};
