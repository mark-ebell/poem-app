// EORTC prognostic index for thyroid cancer (Byar 1979; EE+ 27). EE+ added the 10 points for medullary or
// less-differentiated follicular cancer only when anaplastic was also checked; here they count on their own.
module.exports = {
  id: 'thyroid-eortc',
  eeId: 27,
  title: 'Thyroid cancer 5-year survival (EORTC index)',
  subtitle: 'EORTC prognostic index for thyroid cancer',
  question: 'For a patient with thyroid cancer, what is the 5-year survival?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age at diagnosis', unit: 'years', min: 1, max: 110, step: 1, ee: 'AGE' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'medullary', type: 'check', label: 'Medullary, or principal cell type less-differentiated follicular', ee: 'MEDULLARY' },
    { id: 'anaplastic', type: 'check', label: 'Principal or associated cell type anaplastic', ee: 'PRINCIPAL' },
    { id: 't3', type: 'check', label: 'T3 tumor', ee: 'T3' },
    { id: 'oneMet', type: 'check', label: 'At least 1 distant metastatic site', ee: 'ONE' },
    { id: 'multiMet', type: 'check', label: 'Multiple distant metastatic sites', ee: 'MULTIPLE' }
  ],
  compute(a) {
    const s = a.age + 12 * a.male + 10 * a.medullary + 45 * a.anaplastic + 15 * a.t3 + 15 * a.oneMet + 15 * a.multiMet;
    const p = s <= 49 ? '95%' : s <= 65 ? '80%' : s <= 83 ? '51%' : s <= 108 ? '33%' : '5%';
    return { score: { value: s, label: 'EORTC index' }, headline: `5-year survival: ${p}` };
  }
};
