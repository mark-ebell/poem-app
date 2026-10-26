// BMI, body surface area (Mosteller), lean body weight and ideal body weight (EE+ 180).
module.exports = {
  id: 'bmi-bsa',
  eeId: 180,
  title: 'BMI and body surface area',
  subtitle: 'Body mass index, body surface area, lean and ideal body weight',
  question: 'What are the body mass index, body surface area, lean body weight and ideal body weight?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 60, max: 100, step: 0.1, ee: 'HEIGHT', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 10, max: 999, step: 0.1, ee: 'WEIGHT', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 153, max: 254, step: 0.1, ee: 'HEIGHT', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 5, max: 400, step: 0.1, ee: 'WEIGHT', when: a => a.units === 1 },
    { type: 'heading', label: 'Check if female' },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' }
  ],
  footnote: 'Body surface area (Mosteller) = √(height in cm × weight in kg / 3600). The ideal body weight formula applies to heights of 5 feet (152 cm) or more.',
  compute(a) {
    const us = a.units === 0;
    const cm = us ? a.heightIn * 2.54 : a.heightCm, kg = us ? a.weightLb / 2.2 : a.weightKg, inches = us ? a.heightIn : a.heightCm / 2.54;
    const bmi = kg / Math.pow(cm / 100, 2), bsa = Math.sqrt((cm * kg) / 3600);
    const lbw = a.female ? 1.07 * kg - 148 * (kg * kg) / (cm * cm) : 1.1 * kg - 128 * (kg * kg) / (cm * cm);
    const ibw = (a.female ? 45.5 : 50) + 2.3 * (inches - 60);
    const w = x => (us ? `${(x * 2.2).toFixed(1)} lb` : `${x.toFixed(1)} kg`);
    return { headline: `BMI: ${bmi.toFixed(1)} kg/m²`, lines: [`Body surface area: ${bsa.toFixed(2)} m²`, `Lean body weight: ${w(lbw)}`, `Ideal body weight: ${w(ibw)}`] };
  }
};
