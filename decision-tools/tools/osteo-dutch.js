// Dutch screening instrument for osteoporosis in postmenopausal women (EE+ 130).
const UNITS = { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] };
// [osteoporosis, low BMD] by fracture, age 60+ and BMI under 27
const RISK = { '1,1,1': ['51%', '84%'], '1,1,0': ['22%', '74%'], '1,0,1': ['37%', '78%'], '1,0,0': ['17%', '65%'], '0,1,1': ['37%', '79%'], '0,1,0': ['19%', '59%'], '0,0,1': ['17%', '63%'], '0,0,0': ['9%', '48%'] };

module.exports = {
  id: 'osteo-dutch',
  eeId: 130,
  title: 'Osteoporosis screening (Dutch instrument)',
  subtitle: 'Osteoporosis and low bone density in postmenopausal women',
  question: 'For a postmenopausal woman aged 50 to 80, how likely are osteoporosis and low bone mineral density?',
  inputs: [
    UNITS,
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 84, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 60, max: 450, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 122, max: 213, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 27, max: 205, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 60 or older', ee: 'IDC_CHECKBOX_2' },
    { id: 'fracture', type: 'check', label: 'Fracture in the past 5 years', ee: 'IDC_CHECKBOX_1' }
  ],
  footnote: 'Osteoporosis is a T-score 2.5 SD or more below the mean for a 30-year-old woman; osteopenia is 1 SD or more below it. Low bone mineral density = osteopenia + osteoporosis.',
  compute(a) {
    const m = a.units === 0 ? a.heightIn * 0.0254 : a.heightCm / 100, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, bmi = kg / (m * m);
    const [op, low] = RISK[[+a.fracture, +a.age, +(bmi < 27)].join()];
    return { level: parseInt(op) >= 30 ? 3 : 2, headline: `${op} risk of osteoporosis, ${low} risk of low bone mineral density`, lines: [`BMI ${bmi.toFixed(1)} kg/m²`] };
  }
};
