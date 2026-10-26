// Framingham 10-year risk of atrial fibrillation (Schnabel 2009; EE+ 412).
const FEMALE_AGE = [-3, -2, 0, 1, 3, 4, 6, 7, 8];
const RISK = [2, 2, 3, 4, 6, 8, 12, 16, 22]; // scores 1 to 9
const scoreOf = a => (a.male ? a.age + 1 : FEMALE_AGE[a.age]) + a.bmi + a.htn + a.sbp + a.pr + [0, 5, 4, 2, 1, 0][a.murmur] + [0, 10, 6, 2][a.hf];

module.exports = {
  id: 'framingham-af',
  eeId: 412,
  title: 'Framingham atrial fibrillation risk',
  subtitle: '10-year risk of developing atrial fibrillation',
  question: 'For an adult aged 45 or older without atrial fibrillation, what is the 10-year risk of developing it?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: ['45 to 49', '50 to 54', '55 to 59', '60 to 64', '65 to 69', '70 to 74', '75 to 79', '80 to 84', '85 or older'].map(label => ({ label })) },
    { id: 'pr', type: 'choice', label: 'PR interval', ee: 'CMB_PR', options: [{ label: 'Under 160 ms' }, { label: '160 to 199 ms' }, { label: '200 ms or more' }] },
    { id: 'murmur', type: 'choice', label: 'Age at which a significant cardiac murmur developed', ee: 'CMB_AgeMurmur', options: ['No murmur', '45 to 54', '55 to 64', '65 to 74', '75 to 84', '85 or older'].map(label => ({ label })) },
    { id: 'hf', type: 'choice', label: 'Age at which heart failure developed', ee: 'CMB_HF', options: ['No heart failure', '55 to 64', '65 to 74', '75 or older'].map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'CHK_Male' },
    { id: 'bmi', type: 'check', label: 'Body mass index 30 kg/m² or more', ee: 'CHK_BMI' },
    { id: 'htn', type: 'check', label: 'Current treatment for hypertension', ee: 'CHK_Hyper' },
    { id: 'sbp', type: 'check', label: 'Systolic BP 160 mm Hg or more', ee: 'CHK_SBP' }
  ],
  scoreOf,
  compute(a) {
    const s = scoreOf(a);
    const risk = s <= 0 ? '1% or less' : s >= 10 ? 'more than 30%' : `${RISK[s - 1]}%`;
    return {
      score: { value: s, label: 'Points' },
      headline: `10-year risk of atrial fibrillation: ${risk}`
    };
  }
};
