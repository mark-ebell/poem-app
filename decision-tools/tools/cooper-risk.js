// Cooper Clinic Risk Index: 15-year mortality (EE+ 324).
const MORT = ['1.8%', '2.2%', '2.6%', '3.1%', '3.7%', '4.4%', '5.4%', '6.5%', '7.9%', '9.7%', '11.8%', '14.0%', '16.5%', '20.4%', '23.2%', '28.1%', '32.1%'];
const AVG = ['2.4%', '2.6%', '2.6%', '4.6%', '8.2%', '12.6%', '16.1%', '18.1%'];

module.exports = {
  id: 'cooper-risk',
  eeId: 324,
  title: 'Cooper Clinic Risk Index (15-year mortality)',
  subtitle: '15-year mortality from fitness and risk factors',
  question: 'For an adult man aged 20 to 69, what is the 15-year mortality?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'COMBO_Age', options: ['20 to 34', '35 to 39', '40 to 44', '45 to 49', '50 to 54', '55 to 59', '60 to 64', '65 to 69'].map(label => ({ label })) },
    { id: 'smoker', type: 'choice', label: 'Smoking', ee: 'COMBO_Smoker', options: [{ label: 'Never' }, { label: 'Former' }, { label: 'Current' }] },
    { id: 'fitness', type: 'choice', label: 'Fitness level', ee: 'COMBO_Fitness', options: [{ label: 'Low' }, { label: 'Moderate' }, { label: 'High' }],
      note: 'Low = lowest 20% on a treadmill test; moderate = next 40%; high = top 40%. For example, at age 40 to 49, low is under 11 minutes, moderate 11 to 16, and high 16 or more.' },
    { id: 'units', type: 'choice', label: 'Units', ee: 'RADIO_Units', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 90, step: 0.1, ee: 'EDIT_Height', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 70, max: 600, step: 0.1, ee: 'EDIT_Weight', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 122, max: 229, step: 0.1, ee: 'EDIT_Height', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 32, max: 272, step: 0.1, ee: 'EDIT_Weight', when: a => a.units === 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'hr', type: 'check', label: 'Resting heart rate 80 or more', ee: 'CHK_HeartRate' },
    { id: 'bp', type: 'check', label: 'Systolic BP over 140 or diastolic over 90', ee: 'CHK_BP' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'CHK_Diabetes' }
  ],
  compute(a) {
    const cm = a.units === 0 ? a.heightIn * 2.54 : a.heightCm, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, bmi = kg / Math.pow(cm / 100, 2);
    const s = [0, 0, 0, 3, 6, 8, 9, 10][a.age] + (a.fitness === 0 ? 2 : 0) + [0, 1, 4][a.smoker] + 2 * a.hr + 2 * a.bp + 4 * a.dm + (bmi >= 35 ? 3 : 0);
    return { score: { value: s, label: 'Risk index' }, headline: `Predicted 15-year mortality: ${s < 17 ? MORT[s] : '46.7%'}`, lines: [`Average for this age group: ${AVG[a.age]}`, `BMI ${bmi.toFixed(1)} kg/m²`] };
  }
};
