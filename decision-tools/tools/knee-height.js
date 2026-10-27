// Height from knee height (Chumlea 1985; EE+ 326).
module.exports = {
  id: 'knee-height',
  eeId: 326,
  title: 'Height estimation from knee height',
  subtitle: 'Estimated height for patients who cannot stand',
  question: 'For a bedridden patient, what is the estimated height from knee height?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'COMBO_Units', options: [{ label: 'Inches' }, { label: 'Centimeters' }] },
    { id: 'kneeIn', type: 'number', label: 'Knee height', unit: 'in', min: 10, max: 30, step: 0.1, ee: 'EDIT_Height', when: a => a.units === 0, note: 'With the knee bent at 90 degrees and the foot flat, measure from the bottom of the heel to the top of the knee.' },
    { id: 'kneeCm', type: 'number', label: 'Knee height', unit: 'cm', min: 25, max: 75, step: 0.1, ee: 'EDIT_Height', when: a => a.units === 1, note: 'With the knee bent at 90 degrees and the foot flat, measure from the bottom of the heel to the top of the knee.' },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'EDIT_Age' },
    { type: 'heading', label: 'Check if present' },
    { id: 'male', type: 'check', label: 'Male', ee: 'CHK_Male' }
  ],
  compute(a) {
    const knee = a.units === 0 ? a.kneeIn * 2.54 : a.kneeCm;
    let h = a.male ? 2.02 * knee - 0.04 * a.age + 64.19 : 1.83 * knee - 0.24 * a.age + 84.88;
    if (a.units === 0) h /= 2.54;
    return { headline: `Estimated height: ${Math.trunc(h)} ${a.units === 0 ? 'in' : 'cm'}` };
  },
  evidence: { reference: 'Chumlea WC, Roche AF, Steinbaugh ML. Estimating stature from knee height for persons 60 to 90 years of age. J Am Geriatr Soc. 1985;33(2):116-120.', pmid: '3968366', population: null, validation: null, prevalence: null, developed: null, validated: null }
};
