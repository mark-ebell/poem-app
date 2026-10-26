// Lithium starting dose (Zetin equation, prospective evaluation: Cummings 1993; EE+ 214).
module.exports = {
  id: 'lithium-dose',
  eeId: 214,
  title: 'Lithium dose estimate',
  subtitle: 'Daily lithium dose for a target level',
  question: 'For a patient starting lithium (creatinine 1.4 mg/dL or less and not taking a diuretic), what daily dose is likely to reach the target level?',
  inputs: [
    { id: 'level', type: 'number', label: 'Target lithium level', unit: 'mmol/L', min: 0.3, max: 1.5, step: 0.1, default: 0.8, ee: 'Li_ID' },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'Age_ID' },
    { id: 'units', type: 'choice', label: 'Weight units', ee: 'UNITS', options: [{ label: 'Pounds' }, { label: 'Kilograms' }] },
    { id: 'weight', type: 'number', label: 'Weight', unit: 'lb or kg', min: 20, max: 700, step: 0.1, ee: 'Weight_ID' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'Check_ID0' },
    { id: 'inpatient', type: 'check', label: 'Inpatient', ee: 'Check_ID1' },
    { id: 'tca', type: 'check', label: 'Taking a cyclic antidepressant', ee: 'Check_ID2' }
  ],
  footnote: 'A general guide only; it may not apply to all patients. Careful follow-up and monitoring of levels are still required.',
  compute(a) {
    const kg = a.units === 0 ? a.weight / 2.2 : a.weight;
    const dose = 486.8 + 746.83 * a.level - 10.08 * a.age + 5.95 * kg + 92.01 * a.inpatient + 147.8 * a.male - 74.73 * a.tca;
    return { headline: `Estimated lithium dose: ${Math.trunc(dose)} mg/day` };
  }
};
