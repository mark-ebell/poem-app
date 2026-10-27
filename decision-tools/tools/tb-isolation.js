// Isolation for suspected pulmonary tuberculosis (Wisnivesky 2005; EE+ 298). Wording as in EE+.
module.exports = {
  id: 'tb-isolation',
  eeId: 298,
  title: 'TB isolation decision (Wisnivesky)',
  subtitle: 'Respiratory isolation for suspected pulmonary tuberculosis',
  question: 'For an inpatient with suspected pulmonary tuberculosis, is respiratory isolation needed?',
  inputs: [
    { id: 'temp', type: 'choice', label: 'Temperature', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 38.5°C (101.3°F)' }, { label: '38.5 to 39°C (101.3 to 102.2°F)' }, { label: 'Over 39°C (102.2°F)' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'risk', type: 'check', label: 'TB risk factors or symptoms', ee: 'IDC_CHECKBOX_1' },
    { id: 'ppd', type: 'check', label: 'Positive PPD (tuberculin skin test)', ee: 'IDC_CHECKBOX_2' },
    { id: 'upper', type: 'check', label: 'Upper lobe consolidation on chest x-ray', ee: 'IDC_CHECKBOX_5' },
    { id: 'sob', type: 'check', label: 'Shortness of breath', ee: 'IDC_CHECKBOX_3' },
    { id: 'crackles', type: 'check', label: 'Crackles on exam', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const s = 4 * a.risk + 5 * a.ppd - 3 * a.sob - 3 * a.crackles + 6 * a.upper + 3 * a.temp;
    return s < 1 ? { score: { value: s, label: 'Score' }, level: 1, headline: 'Isolation unlikely to be helpful (99.7% do not have TB)' }
      : { score: { value: s, label: 'Score' }, level: 3, headline: 'Isolation recommended (10% have TB)' };
  }
};
