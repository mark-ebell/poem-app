// Survival of patients with lung cancer in home hospice (EE+ 259).
const D50 = [83, 83, 71, 46, 37, 19, 9, 9, 3], D90 = [443, 443, 346, 184, 121, 67, 65, 34, 10];
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'terminal-lung',
  eeId: 259,
  title: 'Terminal lung cancer survival',
  subtitle: 'Survival of patients with lung cancer admitted to home hospice',
  question: 'For a patient with lung cancer admitted to a home hospice service, how long is survival likely to be?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('tachy', 'Tachycardia', 'TACHYCARDIYA'), check('liver', 'Liver metastases', 'LIVER'), check('feeding', 'Needs help with feeding, or dependent', 'FEEDING'),
    check('toilet', 'Needs help with toileting, or dependent', 'TOILET'), check('tissue', 'Tissue type other than adenocarcinoma or squamous cell', 'TISSUE'),
    check('pain', 'Severe or incapacitating pain', 'PAIN'), check('dry', 'Dry mouth', 'DRY'), check('noWill', 'No living will', 'ABSENCE')
  ],
  compute(a) {
    const n = ['tachy', 'liver', 'feeding', 'toilet', 'tissue', 'pain', 'dry', 'noWill'].reduce((t, k) => t + a[k], 0);
    return { score: { value: n, max: 8, label: 'Risk factors' }, headline: `50% mortality by ${D50[n]} days`, lines: [`90% mortality by ${D90[n]} days`] };
  }
};
