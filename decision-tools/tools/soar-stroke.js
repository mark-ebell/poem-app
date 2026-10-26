// SOAR stroke score: mortality and length of stay (validation: Kwok 2015; EE+ 518).
const { pointsOf } = require('../lib');
const OUT = [[1, 6], [5, 8], [9, 9], [23, 10], [47, 11], [61, 13], [59, 23]];

const tool = module.exports = {
  id: 'soar-stroke',
  eeId: 518,
  title: 'SOAR stroke score',
  subtitle: 'Mortality and length of stay after acute stroke',
  question: 'For an adult admitted with acute stroke, what is the risk of death before discharge, and how long is the stay?',
  inputs: [
    { id: 'type', type: 'choice', label: 'Stroke type', ee: 'STROKE', options: [{ label: 'Hemorrhagic', points: 1 }, { label: 'Ischemic', points: 0 }], default: 1 },
    { id: 'oxford', type: 'choice', label: 'Oxford classification', ee: 'CIRCULATION', options: [
      { label: 'Lacunar infarct', points: 0 }, { label: 'Partial anterior circulation infarct', points: 0 }, { label: 'Posterior circulation infarct', points: 1 }, { label: 'Total anterior circulation infarct', points: 2 }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '65 or younger', points: 0 }, { label: '66 to 85', points: 1 }, { label: 'Over 85', points: 2 }] },
    { id: 'rankin', type: 'choice', label: 'Modified Rankin Scale before the stroke', ee: 'RANKIN', options: [{ label: '0 to 2', points: 0 }, { label: '3 or 4', points: 1 }, { label: '5', points: 2 }] }
  ],
  points: { label: 'SOAR score', max: 7 },
  compute(a) {
    const [mort, los] = OUT[Math.min(6, pointsOf(tool, a))];
    return { headline: `Mortality at discharge: ${mort}%`, lines: [`Median length of stay for survivors: ${los} days`] };
  }
};
