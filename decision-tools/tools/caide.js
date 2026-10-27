// CAIDE dementia risk score: dementia in 20 years from midlife risk factors (Kivipelto 2006; EE+ 383).
module.exports = {
  id: 'caide',
  eeId: 383,
  title: 'Dementia risk in 20 years (CAIDE)',
  subtitle: 'Dementia 20 years later from midlife risk factors',
  question: 'For a middle-aged adult, what is the risk of dementia over the next 20 years?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [{ label: 'Under 47' }, { label: '47 to 53' }, { label: 'Over 53' }] },
    { id: 'education', type: 'choice', label: 'Education', ee: 'CMB_Education', options: [{ label: 'More than 9 years' }, { label: '7 to 9 years' }, { label: 'Under 7 years' }] },
    { id: 'apoe', type: 'choice', label: 'APOE ε4 status', ee: 'CMB_APOE', options: [{ label: 'Unknown' }, { label: 'Negative' }, { label: 'Positive' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'CHK_Male' },
    { id: 'sbp', type: 'check', label: 'Systolic BP over 140 mm Hg', ee: 'CHK_BP' },
    { id: 'bmi', type: 'check', label: 'BMI over 30 kg/m²', ee: 'CHK_BMI' },
    { id: 'chol', type: 'check', label: 'Total cholesterol over 6.5 mmol/L (250 mg/dL)', ee: 'CHK_Cholesterol' },
    { id: 'inactive', type: 'check', label: 'Physically inactive (activity less than twice a week for 20 to 30 minutes)', ee: 'CHK_Inactive' }
  ],
  footnote: 'Without an APOE result the score uses model 1; with one, model 2.',
  compute(a) {
    const m2 = a.apoe > 0;
    const s = [0, 3, m2 ? 5 : 4][a.age] + [0, m2 ? 3 : 2, m2 ? 4 : 3][a.education] + a.male + 2 * a.sbp + 2 * a.bmi + (m2 ? 1 : 2) * a.chol + a.inactive + (a.apoe === 2 ? 2 : 0);
    const bands = m2 ? [[5, '0.3%', '1 of 293'], [8, '1.7%', '6 of 363'], [12, '4.5%', '22 of 490'], [Infinity, '16.4%', '28 of 172']]
      : [[5, '1.0%', '4 of 401'], [7, '1.9%', '5 of 270'], [9, '4.2%', '13 of 312'], [11, '7.4%', '18 of 245'], [Infinity, '16.4%', '20 of 122']];
    const [, p, n] = bands.find(([max]) => s <= max);
    return { score: { value: s, label: 'Risk score' }, headline: `${p} risk of dementia in 20 years (${n})` };
  }
};
