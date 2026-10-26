// HAIR score: NASH in severe obesity (Dixon 2001; EE+ 241). IR index = ln(insulin, mU/L) + ln(glucose, mmol/L),
// as in EE+'s SI branch (its conventional-units branch also multiplied insulin by 6.945; see the review doc).
module.exports = {
  id: 'hair-score',
  eeId: 241,
  title: 'HAIR score (NASH in severe obesity)',
  subtitle: 'Nonalcoholic steatohepatitis in severely obese patients',
  question: 'For a severely obese patient (BMI above 35), how likely is nonalcoholic steatohepatitis?',
  inputs: [
    { id: 'insulin', type: 'number', label: 'Fasting insulin', unit: 'µU/mL (= mU/L)', min: 1, max: 500, step: 0.1, ee: 'Insulin_ID' },
    { id: 'units', type: 'choice', label: 'Glucose units', ee: 'UNITS', options: [{ label: 'mg/dL' }, { label: 'mmol/L' }] },
    { id: 'glucoseMg', type: 'number', label: 'Fasting glucose', unit: 'mg/dL', min: 30, max: 600, step: 1, ee: 'Glucose_ID', when: a => a.units === 0 },
    { id: 'glucoseMmol', type: 'number', label: 'Fasting glucose', unit: 'mmol/L', min: 1.5, max: 33, step: 0.1, ee: 'Glucose_ID', when: a => a.units === 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'alt', type: 'check', label: 'ALT above 40 U/L', ee: 'Check_ID0' },
    { id: 'htn', type: 'check', label: 'Hypertension', ee: 'Check_ID1' }
  ],
  footnote: 'Not prospectively validated.',
  compute(a) {
    const glucose = a.units === 0 ? a.glucoseMg * 0.0555 : a.glucoseMmol;
    const s = a.alt + a.htn + (Math.log(a.insulin) + Math.log(glucose) > 5 ? 1 : 0);
    return s <= 1 ? { score: { value: s, max: 3, label: 'HAIR score' }, level: 1, headline: '5 of 75 (6.7%) had NASH (LR 0.22)' }
      : s === 2 ? { score: { value: s, max: 3, label: 'HAIR score' }, level: 3, headline: '11 of 19 (58%) had NASH (LR 4.2)' }
      : { score: { value: s, max: 3, label: 'HAIR score' }, level: 4, headline: '10 of 11 (91%) had NASH (LR 30)' };
  }
};
