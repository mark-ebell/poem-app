// CAGE questions for alcoholism (EE+ 176).
const P = [['2%', '3%', '7%'], ['14%', '27%', '46%'], ['33%', '53%', '72%'], ['59%', '76%', '88%'], ['92%', '96%', '98%']];

module.exports = {
  id: 'cage',
  eeId: 176,
  title: 'CAGE questions (alcoholism screening)',
  subtitle: 'Four-question screen for alcoholism',
  question: 'For an adult, how likely is alcoholism from the CAGE questions?',
  inputs: [
    { id: 'prevalence', type: 'choice', label: 'Overall percentage with alcoholism in your setting', ee: 'IDC_COMBOBOX_1', default: 1, options: [{ label: '10%' }, { label: '20%' }, { label: '36%' }] },
    { type: 'heading', label: 'Check each yes answer' },
    { id: 'cut', type: 'check', label: 'Have you ever felt you should cut down on your drinking?', ee: 'IDC_CHECKBOX_1' },
    { id: 'annoyed', type: 'check', label: 'Have people annoyed you by criticizing your drinking?', ee: 'IDC_CHECKBOX_2' },
    { id: 'guilty', type: 'check', label: 'Have you ever felt guilty or bad about your drinking?', ee: 'IDC_CHECKBOX_3' },
    { id: 'eye', type: 'check', label: 'Have you ever had a drink first thing in the morning to steady your nerves (eye-opener)?', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const n = a.cut + a.annoyed + a.guilty + a.eye;
    return { score: { value: n, max: 4, label: 'CAGE score' }, level: [1, 2, 3, 4, 4][n], headline: `Probability of alcoholism: ${P[n][a.prevalence]}` };
  }
};
