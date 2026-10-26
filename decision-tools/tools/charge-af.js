// CHARGE-AF simple model: 5-year risk of atrial fibrillation (Alonso 2013). Not an EE+ tool; added at
// Mark Ebell's request (2026-10-26) beside the Framingham AF score (EE+ 412). Coefficients from Table 3.
const COEF = { age: 0.508, white: 0.465, height: 0.248, weight: 0.115, sbp: 0.197, dbp: -0.101, smoker: 0.359, antihtn: 0.349, dm: 0.237, hf: 0.701, mi: 0.496 };

module.exports = {
  id: 'charge-af',
  title: 'CHARGE-AF atrial fibrillation risk',
  subtitle: '5-year risk of developing atrial fibrillation',
  question: 'For an adult aged 46 to 94 without atrial fibrillation, what is the 5-year risk of developing it?',
  categories: ['Cardiovascular: Other'],
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 46, max: 94, step: 1 },
    { id: 'race', type: 'choice', label: 'Race', options: [{ label: 'White' }, { label: 'Black' }], note: 'The model was developed in white and Black adults; for other groups it is uncertain.' },
    { id: 'units', type: 'choice', label: 'Units for height and weight', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 90, step: 0.1, when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 70, max: 600, step: 0.1, when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 230, step: 0.1, when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 30, max: 270, step: 0.1, when: a => a.units === 1 },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 70, max: 250, step: 1 },
    { id: 'dbp', type: 'number', label: 'Diastolic BP', unit: 'mm Hg', min: 30, max: 150, step: 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'smoker', type: 'check', label: 'Current smoker' },
    { id: 'antihtn', type: 'check', label: 'Taking antihypertensive medication' },
    { id: 'dm', type: 'check', label: 'Diabetes' },
    { id: 'hf', type: 'check', label: 'History of heart failure' },
    { id: 'mi', type: 'check', label: 'History of myocardial infarction' }
  ],
  compute(a) {
    const cm = a.units === 0 ? a.heightIn * 2.54 : a.heightCm, kg = a.units === 0 ? a.weightLb / 2.2046 : a.weightKg;
    const x = COEF.age * a.age / 5 + (a.race === 0 ? COEF.white : 0) + COEF.height * cm / 10 + COEF.weight * kg / 15 + COEF.sbp * a.sbp / 20 + COEF.dbp * a.dbp / 10
      + COEF.smoker * a.smoker + COEF.antihtn * a.antihtn + COEF.dm * a.dm + COEF.hf * a.hf + COEF.mi * a.mi;
    const risk = 100 * (1 - Math.pow(0.9718412736, Math.exp(x - 12.58156)));
    return { headline: `5-year risk of atrial fibrillation: ${risk.toFixed(1)}%` };
  },
  evidence: {
    reference: 'Alonso A, Krijthe BP, Aspelund T, et al. Simple risk model predicts incidence of atrial fibrillation in a racially and geographically diverse population: the CHARGE-AF consortium. J Am Heart Assoc. 2013;2(2):e000102.',
    pmid: '23537808',
    population: 'Derived in 18,556 adults aged 46 to 94 (19% African American) from the ARIC, CHS and Framingham cohorts; validated in 7672 adults from the AGES (Iceland) and Rotterdam studies.',
    validation: 'C statistic 0.765 in the derivation cohorts; 0.66 and 0.71 in the two validation cohorts, with adequate calibration.',
    prevalence: null, developed: 18556, validated: 7672, comment: null
  }
};
