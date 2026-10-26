// Ideal body weight (Devine) and BMI (EE+ 102).
module.exports = {
  id: 'ideal-body-weight',
  eeId: 102,
  title: 'Ideal body weight and BMI (adults)',
  subtitle: 'Devine ideal body weight and body mass index',
  question: 'For an adult, what are the ideal body weight and the body mass index?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 96, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 50, max: 900, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 245, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 20, max: 410, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 },
    { type: 'heading', label: 'Check if male' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_1' }
  ],
  footnote: 'Ideal body weight: 50 kg (men) or 45 kg (women) plus 2.3 kg per inch over 5 feet.',
  compute(a) {
    const inches = a.units === 0 ? a.heightIn : a.heightCm / 2.54;
    const kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, m = inches * 0.0254;
    const ibwKg = (a.male ? 50 : 45) + 2.3 * (inches - 60);
    return { headline: `Ideal body weight: ${Math.round(ibwKg * 2.2)} lb / ${Math.round(ibwKg)} kg`, lines: [`BMI: ${(kg / (m * m)).toFixed(1)} kg/m²`] };
  }
};
