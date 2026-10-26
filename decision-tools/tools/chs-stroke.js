// Cardiovascular Health Study 5-year stroke score for older adults (Lumley 2002; EE+ 145).
// As in EE+, LVH, creatinine, diabetes and impaired fasting glucose are added twice (see the review doc).
const MEN = ['2.5% (95% CI 2.1 to 3.0%)', '3.5% (95% CI 2.8 to 4.5%)', '5.2% (95% CI 4.2 to 6.4%)', '7.9% (95% CI 6.1 to 10%)', '12% (95% CI 10 to 15%)', '19% (95% CI 16 to 23%)', '27% (95% CI 22 to 32%)', '42% (95% CI 36 to 46%)', '59% (95% CI 58 to 61%)'];
const WOMEN = ['3.5% (1.3 to 2.2)', '2.4% (1.8 to 3.3)', '3.6% (2.6 to 4.9)', '5.6% (4.1 to 7.5)', '9.2% (7.1 to 11)', '14% (11 to 17)', '21% (16 to 26)', '29% (26 to 36)', '39% (35 to 46)'];
const scoreOf = a => (a.walk + 1) + 2 * a.sbp + (a.male ? 3 * a.age + 16 * a.af + 5 * a.heart : 5 * a.age + 5 * a.af + a.heart)
  + 2 * (6 * a.lvh + 2 * a.creat + 6 * a.dm + 4 * a.ifg);

module.exports = {
  id: 'chs-stroke',
  eeId: 145,
  title: 'Stroke risk in older adults (Cardiovascular Health Study)',
  subtitle: '5-year risk of stroke in adults 65 and older',
  question: 'For an adult aged 65 or older, what is the 5-year risk of stroke?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: ['70 or younger', '71 to 77', '78 to 84', '85 to 91', '92 or older'].map(label => ({ label })) },
    { id: 'sbp', type: 'choice', label: 'Systolic BP', ee: 'SYSTOLIC', options: ['Under 125 mm Hg', '125 to 134', '135 to 144', '145 to 154', '155 to 164', '165 to 174', '175 to 184', '185 or more'].map(label => ({ label })) },
    { id: 'walk', type: 'choice', label: 'Time to walk 15 feet', ee: 'TIME', options: Array.from({ length: 20 }, (_, k) => ({ label: k === 19 ? '20 seconds or more' : `${k + 1} second${k ? 's' : ''}` })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'lvh', type: 'check', label: 'Left ventricular hypertrophy on ECG', ee: 'LVH' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation on ECG', ee: 'AFIB' },
    { id: 'heart', type: 'check', label: 'History of heart disease', ee: 'HEART' },
    { id: 'dm', type: 'check', label: 'Definite diabetes', ee: 'DIABETES' },
    { id: 'ifg', type: 'check', label: 'Impaired fasting glucose', ee: 'IMPAIRED' },
    { id: 'creat', type: 'check', label: 'Serum creatinine above 1.25 mg/dL (110 µmol/L)', ee: 'SERUM' }
  ],
  scoreOf,
  compute(a) {
    const s = scoreOf(a), i = Math.min(8, Math.floor((s - 1) / 5));
    return { score: { value: s, label: 'Score' }, headline: `5-year stroke risk: ${(a.male ? MEN : WOMEN)[i]}` };
  }
};
