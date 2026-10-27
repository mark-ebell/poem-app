// Polycystic ovary syndrome questionnaire (Pedersen 2007; EE+ 397).
const SITES = [['lip', 'Upper lip', 'CHK_UpperLip'], ['chin', 'Chin', 'CHK_Chin'], ['chest', 'Chest between the breasts', 'CHK_Chest'], ['breasts', 'Breasts', 'CHK_Breasts'],
  ['belly', 'Belly', 'CHK_Belly'], ['back', 'Back', 'CHK_Back'], ['arms', 'Upper arms', 'CHK_UpperArms'], ['thighs', 'Upper thighs', 'CHK_UpperThighs']];

module.exports = {
  id: 'pcos-pedersen',
  eeId: 397,
  title: 'Polycystic ovary syndrome questionnaire (Pedersen)',
  subtitle: 'Diagnosis of polycystic ovary syndrome',
  question: 'For a woman evaluated for hirsutism, infertility or irregular periods, how likely is polycystic ovary syndrome?',
  inputs: [
    { id: 'cycle', type: 'choice', label: '1. Between ages 16 and 40, how long was your average menstrual cycle (first day of one period to the first day of the next)?', ee: 'CMB_Period',
      options: ['Under 25 days', '25 to 34 days', '35 to 60 days', 'Over 60 days', 'Totally variable'].map(label => ({ label })) },
    { type: 'heading', label: '2. During your menstruating years (not counting pregnancy), did you tend to grow coarse hair? Check every site:' },
    ...SITES.map(([id, label, ee]) => ({ id, type: 'check', label, ee })),
    { type: 'heading', label: 'Between ages 16 and 40: check all that apply' },
    { id: 'obese', type: 'check', label: '3. Ever obese or overweight', ee: 'CHK_Obese' },
    { id: 'discharge', type: 'check', label: '4. Ever noticed a milky discharge from the nipples (not during or shortly after pregnancy)', ee: 'CHK_Discharge' }
  ],
  compute(a) {
    const sites = SITES.filter(([id]) => a[id]).length;
    const s = (a.cycle > 1 ? 1 : 0) + (sites >= 3 ? 1 : 0) + a.obese - a.discharge;
    return s >= 2
      ? { score: { value: s, label: 'Score' }, level: 3, headline: 'PCOS likely: 35 of 41 with this score had PCOS' }
      : { score: { value: s, label: 'Score' }, level: 1, headline: 'PCOS unlikely: 71 of 76 with this score did not have PCOS' };
  }
};
