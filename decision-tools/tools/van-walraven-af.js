// Stroke risk in atrial fibrillation on aspirin (van Walraven 2003; EE+ 306). Wording as in EE+.
module.exports = {
  id: 'van-walraven-af',
  eeId: 306,
  title: 'Stroke risk in atrial fibrillation on aspirin (van Walraven)',
  subtitle: 'Identifying low-risk patients taking aspirin',
  question: 'For a patient with nonvalvular atrial fibrillation taking aspirin, what is the yearly risk of stroke?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'stroke', type: 'check', label: 'Previous stroke or TIA', ee: 'IDC_CHECKBOX_1' },
    { id: 'htn', type: 'check', label: 'Treated hypertension, or systolic BP 140 mm Hg or more', ee: 'IDC_CHECKBOX_2' },
    { id: 'cad', type: 'check', label: 'Angina or previous MI', ee: 'IDC_CHECKBOX_3' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    return a.stroke || a.htn || a.cad || a.dm
      ? { level: 3, headline: 'Moderate or high risk: 4.2 strokes per 100 patient-years; warfarin recommended' }
      : { level: 1, headline: 'Low risk: 1.1 strokes per 100 patient-years; aspirin recommended' };
  }
};
