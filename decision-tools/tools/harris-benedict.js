// Harris-Benedict basal energy expenditure (EE+ 105; coefficients as in EE+).
module.exports = {
  id: 'harris-benedict',
  eeId: 105,
  title: 'Basal energy requirement (Harris-Benedict)',
  subtitle: 'Basal energy expenditure in kcal/day',
  question: 'What is the basal energy requirement for this adult?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 96, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 50, max: 900, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 245, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 20, max: 410, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'IDC_EDIT_3' },
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'GENDER', options: [{ label: 'Male' }, { label: 'Female' }] }
  ],
  compute(a) {
    const cm = a.units === 0 ? a.heightIn * 2.54 : a.heightCm, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg;
    const kcal = a.sex === 0 ? 13.8 * kg + 5 * cm - 6.76 * a.age + 66.5 : 9.56 * kg + 1.86 * cm - 4.68 * a.age + 655;
    return { headline: `Basal energy requirement: ${Math.round(kcal)} kcal/day` };
  }
};
