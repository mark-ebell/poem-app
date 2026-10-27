// Gestational diabetes risk (Naylor 1997; EE+ 10).
const OUT = [['0.9%', 544], ['0.9%', 544], ['3.7%', 322], ['3.9%', 284], ['7.3%', 330], ['7.3%', 330]];

module.exports = {
  id: 'gdm-naylor',
  eeId: 10,
  title: 'Gestational diabetes risk (Naylor)',
  subtitle: 'Probability of gestational diabetes',
  question: 'For a pregnant woman without known diabetes, before 24 weeks, how likely is gestational diabetes?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: 'Under 31' }, { label: '31 to 34' }, { label: 'Over 34' }] },
    { id: 'race', type: 'choice', label: 'Race', ee: 'RACE', options: [{ label: 'White' }, { label: 'Black' }, { label: 'Asian' }, { label: 'Other' }] },
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 84, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 70, max: 500, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 215, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 30, max: 230, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 }
  ],
  compute(a) {
    const m = a.units === 0 ? a.heightIn * 0.0254 : a.heightCm / 100, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, bmi = kg / (m * m);
    const s = a.age + [0, 0, 5, 2][a.race] + (bmi > 25 ? 3 : bmi > 22 ? 2 : 0);
    const [p, n] = s >= 6 ? ['18.7%', 91] : OUT[s];
    return { score: { value: s, label: 'Score' }, headline: `Probability of gestational diabetes: ${p}`, lines: [`${n} women were in this risk group; BMI ${bmi.toFixed(1)} kg/m².`] };
  }
};
