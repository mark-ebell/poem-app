// Adult ADHD Self-Report Scale screener (WHO ASRS v1.1, part A; Kessler 2005; EE+ 297).
const FREQ = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'].map(label => ({ label }));
const Q = ['How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?',
  'How often do you have difficulty getting things in order when you have to do a task that requires organization?',
  'How often do you have problems remembering appointments or obligations?',
  'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?',
  'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?',
  'How often do you feel overly active and compelled to do things, like you were driven by a motor?'];

module.exports = {
  id: 'asrs',
  eeId: 297,
  title: 'Adult ADHD screener (WHO ASRS)',
  subtitle: 'Six-question screen for adult ADHD',
  question: 'For an adult, does the WHO Adult ADHD Self-Report Scale screener suggest ADHD?',
  inputs: Q.map((label, k) => ({ id: `q${k + 1}`, type: 'choice', label: `${k + 1}. ${label}`, ee: `IDC_COMBOBOX_${k + 1}`, options: FREQ })),
  footnote: 'Questions 1 to 3 count at "sometimes" or more; questions 4 to 6 at "often" or more. 4 or more is positive. With a 20% pretest probability, 90% with a positive screen and 10% with a negative screen have ADHD.',
  compute(a) {
    const n = [1, 2, 3].filter(k => a[`q${k}`] >= 2).length + [4, 5, 6].filter(k => a[`q${k}`] >= 3).length;
    return n >= 4 ? { score: { value: n, max: 6, label: 'Items' }, level: 3, headline: 'Positive screen for adult ADHD' } : { score: { value: n, max: 6, label: 'Items' }, level: 1, headline: 'Negative screen for adult ADHD' };
  }
};
