// COAG clinical algorithm: initial warfarin dose for a target INR of 2 to 3 (Gage 2008; Kimmel 2013; EE+ 507).
const bsaOf = a => { const cm = a.units === 0 ? a.heightCm : a.heightIn * 2.54, kg = a.units === 0 ? a.weightKg : a.weightLb / 2.2; return Math.pow(kg, 0.425) * Math.pow(cm, 0.725) / 139.2; };
const SIZE = [
  { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Centimeters and kilograms' }, { label: 'Inches and pounds' }] },
  { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 200, step: 1, ee: 'HEIGHT', when: a => a.units === 0 },
  { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 30, max: 250, step: 1, ee: 'WEIGHT', when: a => a.units === 0 },
  { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 84, step: 1, ee: 'HEIGHT', when: a => a.units === 1 },
  { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 70, max: 400, step: 1, ee: 'WEIGHT', when: a => a.units === 1 }
];

module.exports = {
  id: 'warfarin-coag-start',
  eeId: 507,
  title: 'Warfarin starting dose (COAG clinical algorithm)',
  subtitle: 'Initial warfarin dose for a target INR of 2.0 to 3.0',
  question: 'For an adult starting warfarin with a target INR of 2.0 to 3.0, what initial daily dose does the clinical algorithm suggest?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'AGE' },
    ...SIZE,
    { type: 'heading', label: 'Check all that apply' },
    { id: 'black', type: 'check', label: 'Black race', ee: 'BLACK' },
    { id: 'smoker', type: 'check', label: 'Smoker', ee: 'SMOKE' },
    { id: 'amio', type: 'check', label: 'Taking amiodarone', ee: 'AMIO' },
    { id: 'vte', type: 'check', label: 'Warfarin is for DVT or PE', ee: 'DVT' }
  ],
  SIZE, bsaOf,
  compute(a) {
    const x = 0.613 - 0.0075 * a.age + 0.156 * a.black + 0.108 * a.smoker + 0.425 * bsaOf(a) - 0.257 * a.amio + 0.216 * 2.5 + 0.0784 * a.vte;
    return { headline: `Suggested initial dose: ${Math.exp(x).toFixed(1)} mg/day`, lines: [`Body surface area ${bsaOf(a).toFixed(2)} m²`] };
  }
};
