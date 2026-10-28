// CRAFFT screen for adolescent substance use (Knight 1999; EE+ 371). Wording as in EE+.
const Q = [['car', 'Have you ever ridden in a car driven by someone (including yourself) who was high or had been using alcohol or drugs?', 'CHK_0'],
  ['relax', 'Do you ever use alcohol or drugs to relax, feel better about yourself, or fit in?', 'CHK_1'], ['alone', 'Do you ever use alcohol or drugs while you are by yourself, or alone?', 'CHK_2'],
  ['forget', 'Do you ever forget things you did while using alcohol or drugs?', 'CHK_3'], ['family', 'Do your family or friends ever tell you that you should cut down on your drinking or drug use?', 'CHK_4'],
  ['trouble', 'Have you ever gotten into trouble while you were using alcohol or drugs?', 'CHK_5']];

module.exports = {
  id: 'crafft',
  eeId: 371,
  title: 'Adolescent substance use (CRAFFT)',
  subtitle: 'Six-question screen for substance use problems in adolescents',
  question: 'For an adolescent, does the CRAFFT suggest a substance use problem?',
  inputs: [
    { type: 'heading', label: 'Check each yes answer' },
    ...Q.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const n = Q.reduce((t, [id]) => t + a[id], 0);
    return n >= 2 ? { score: { value: n, max: 6, label: 'CRAFFT score' }, level: 3, headline: 'Assessment recommended' } : { score: { value: n, max: 6, label: 'CRAFFT score' }, level: 1, headline: 'No assessment recommended' };
  }
};
