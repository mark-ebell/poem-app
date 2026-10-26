// Benefit of carotid endarterectomy for symptomatic stenosis of 70% to 99% (Rothwell 1999, ECST; EE+ 35).
const STROKE = ['0%', '6% (95% CI 0 to 14%)', '13% (95% CI 7 to 20%)', '21% (95% CI 13 to 29%)', '45% (95% CI 31 to 60%)', '38% (95% CI 9 to 68%)'];
const SURG = ['4.7% (95% CI 2.6 to 7.6%)', '7.3% (95% CI 4.3 to 11%)', '12.5% (95% CI 6 to 23%)', '12.5% (95% CI 6 to 23%)'];

module.exports = {
  id: 'ecst-carotid',
  eeId: 35,
  title: 'Carotid endarterectomy benefit (ECST model)',
  subtitle: 'Stroke risk with medical treatment and with surgery for symptomatic carotid stenosis',
  question: 'For a patient with a recent carotid-territory TIA or stroke and 70% to 99% stenosis, how do the risks with medical treatment and with endarterectomy compare?',
  inputs: [
    { id: 'degree', type: 'choice', label: 'Degree of stenosis', ee: 'DEGREE', options: [{ label: '70% to 79%' }, { label: '80% to 89%' }, { label: '90% to 99%' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'cerebral', type: 'check', label: 'Cerebral (rather than ocular) event', ee: 'CEREBRAL' },
    { id: 'plaque', type: 'check', label: 'Irregular plaque surface', ee: 'PLAQUE' },
    { id: 'recent', type: 'check', label: 'Event within the past 2 months (carotid TIA, minor or non-disabling stroke, or retinal infarction)', ee: 'EVENTS' },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' },
    { id: 'pvd', type: 'check', label: 'Peripheral vascular disease (claudication or previous surgery for ischemia)', ee: 'PV' },
    { id: 'sbp', type: 'check', label: 'Systolic BP over 180 mm Hg', ee: 'SYSTOLIC' }
  ],
  compute(a) {
    const med = a.cerebral + a.plaque + a.recent + a.degree, surg = a.pvd + a.female + a.sbp, low = med + surg <= 3;
    return {
      headline: `5-year risk of adverse outcome: ${low ? '11%' : '7%'} with surgery, ${low ? '12%' : '40%'} with medical treatment`,
      lines: [`5-year risk of ipsilateral ischemic stroke with medical treatment: ${STROKE[med]}`, `30-day risk of major stroke or death after endarterectomy: ${SURG[surg]}`]
    };
  },
  evidence: { reference: "Rothwell PM, Warlow CP. Prediction of benefit from carotid endarterectomy in individual patients: a risk-modelling study. European Carotid Surgery Trialists' Collaborative Group. Lancet. 1999;353(9170):2105-2110." }
};
