// Response of dyspepsia to omeprazole (Meineche-Schmidt 2001; EE+ 128).
module.exports = {
  id: 'omeprazole-response',
  eeId: 128,
  title: 'Dyspepsia: response to omeprazole',
  subtitle: 'Benefit of a proton pump inhibitor for dyspepsia in primary care',
  question: 'For a primary care patient with dyspepsia, how likely is benefit from omeprazole?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 90, step: 0.1, ee: 'IDC_Height_ID', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 60, max: 600, step: 0.1, ee: 'IDC_Weight_ID', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 230, step: 0.1, ee: 'IDC_Height_ID', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 27, max: 270, step: 0.1, ee: 'IDC_Weight_ID', when: a => a.units === 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'night', type: 'check', label: 'Pain at night', ee: 'IDC_Check1_ID' },
    { id: 'antacids', type: 'check', label: 'Took antacids or H2 blockers in the past month', ee: 'IDC_Check2_ID' },
    { id: 'nausea', type: 'check', label: 'Nausea', ee: 'IDC_Check3_ID' }
  ],
  compute(a) {
    const m = a.units === 0 ? a.heightIn * 0.0254 : a.heightCm / 100, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, bmi = kg / (m * m);
    const s = -0.67 + 0.16 * (bmi - 25) + 1.69 * a.night + 1.3 * a.antacids - 1.83 * a.nausea;
    const [level, label, p] = s < 0 ? [1, 'Low', '4.6%'] : s <= 1.5 ? [2, 'Moderate', '19.3%'] : [3, 'High', '39.4%'];
    return { score: { value: Number(s.toFixed(2)), label: 'Score' }, level, headline: `${label} probability of benefit (${p})`, lines: [`BMI ${bmi.toFixed(1)} kg/m²`] };
  }
};
