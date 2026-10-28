// GAD-7 (Spitzer 2006; EE+ 359).
const FREQ = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((label, points) => ({ label, points }));
const Q = [['nervous', 'Feeling nervous, anxious or on edge', 'CMB_Nervous'], ['stop', 'Not being able to stop or control worrying', 'CMB_StopWorry'], ['tooMuch', 'Worrying too much about different things', 'CMB_WorryTooMuch'],
  ['relax', 'Trouble relaxing', 'CMB_Relax'], ['restless', 'Being so restless that it is hard to sit still', 'CMB_Restless'], ['irritable', 'Becoming easily annoyed or irritable', 'CMB_Annoyed'],
  ['afraid', 'Feeling afraid as if something awful might happen', 'CMB_Awful']];
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'gad7',
  eeId: 359,
  title: 'Generalized anxiety disorder (GAD-7)',
  subtitle: 'Seven-question anxiety screen',
  question: 'Over the last 2 weeks, how often has the patient been bothered by these problems?',
  inputs: Q.map(([id, label, ee]) => ({ id, type: 'choice', label, ee, options: FREQ })),
  points: { label: 'GAD-7', max: 21 },
  footnote: 'A score of 10 or more is 89% sensitive and 82% specific for generalized anxiety disorder.',
  compute(a) {
    return pointsOf(tool, a) >= 10 ? { level: 3, headline: 'Positive screen for generalized anxiety disorder' } : { level: 1, headline: 'Negative screen for generalized anxiety disorder' };
  }
};
