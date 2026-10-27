// 1-year mortality after hospital discharge for patients over 65 (EE+ 389).
module.exports = {
  id: 'discharge-mortality-65',
  eeId: 389,
  title: '1-year mortality after hospital discharge (over 65)',
  subtitle: 'Mortality in the year after discharge for older adults',
  question: 'For a patient over 65 discharged from hospital, what is the risk of death within 1 year?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [{ label: '65 to 69' }, { label: '70 to 74' }, { label: '75 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    ...[['nh', 'Discharged to a nursing home or skilled care facility', 'CHK_Discharge'], ['los', 'Length of stay 5 days or more', 'CHK_Length'], ['chf', 'Heart failure', 'CHK_CHF'],
      ['pvd', 'Peripheral vascular disease', 'CHK_PVD'], ['dementia', 'Dementia', 'CHK_Dementia'], ['renal', 'Renal disease', 'CHK_Renal'], ['cancer', 'Hematologic or solid malignancy', 'CHK_Malignancy'],
      ['mets', 'Metastatic cancer', 'CHK_Metastatic']].map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const s = a.nh + a.los + a.chf + a.pvd + a.dementia + a.renal + a.cancer + 2 * a.mets + a.age;
    const m = s < 2 ? '14% (95% CI 12% to 16%)' : s < 3 ? '24% (95% CI 22% to 27%)' : s < 4 ? '30% (95% CI 26% to 33%)' : '42% (95% CI 38% to 45%)';
    return { score: { value: s, label: 'Risk score' }, level: s < 2 ? 1 : s < 4 ? 2 : 3, headline: `1-year mortality: ${m}` };
  }
};
